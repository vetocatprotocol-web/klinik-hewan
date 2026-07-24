"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { billingSchema, billingItemSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { generateBillingNumber, generateInvoiceNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";

const BILLING_ROLES = ["OWNER", "DOKTER"];

export async function createBilling(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!BILLING_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    customerId: formData.get("customerId") as string,
    petId: formData.get("petId") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const validated = billingSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const billingNumber = generateBillingNumber(new Date());

  const billing = await prisma.billing.create({
    data: {
      billingNumber,
      customerId: data.customerId,
      petId: data.petId,
      billingStartDate: new Date(),
      notes: data.notes,
      createdBy: session.user.id!,
      status: "OPEN",
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Billing",
    entityId: billing.id,
    changes: { billingNumber: { old: null, new: billingNumber } },
  });

  return { success: true, data: billing.id };
}

export async function addBillingItem(
  billingId: string,
  itemType: string,
  itemId: string,
  quantity: number,
  notes?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!BILLING_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const billing = await prisma.billing.findUnique({ where: { id: billingId } });
  if (!billing) {
    return { success: false, error: { message: "Billing tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (billing.status !== "OPEN") {
    return { success: false, error: { message: "Hanya billing OPEN yang bisa ditambah item", code: "BUSINESS_RULE" } };
  }

  // Validate item exists and get price from master data (doctor cannot set price)
  let unitPrice = 0;
  let itemName = "";
  if (itemType === "SERVICE") {
    const service = await prisma.service.findUnique({ where: { id: itemId } });
    if (!service || service.status !== "ACTIVE") {
      return { success: false, error: { message: "Layanan tidak ditemukan atau tidak aktif", code: "NOT_FOUND" } };
    }
    unitPrice = Number(service.price);
    itemName = service.name;
  } else if (itemType === "DRUG") {
    const drug = await prisma.drug.findUnique({ where: { id: itemId } });
    if (!drug || drug.status !== "ACTIVE") {
      return { success: false, error: { message: "Obat tidak ditemukan atau tidak aktif", code: "NOT_FOUND" } };
    }
    unitPrice = Number(drug.pricePerUnit);
    itemName = drug.name;
  } else if (itemType === "PRODUCT") {
    const product = await prisma.product.findUnique({ where: { id: itemId } });
    if (!product || product.status !== "ACTIVE") {
      return { success: false, error: { message: "Produk tidak ditemukan atau tidak aktif", code: "NOT_FOUND" } };
    }
    if (product.currentStock < quantity) {
      return { success: false, error: { message: `Stok ${product.name} tidak mencukupi. Stok tersedia: ${product.currentStock}`, code: "INSUFFICIENT_STOCK" } };
    }
    unitPrice = Number(product.price);
    itemName = product.name;

    const stockUserId = session.user.id!;

    // Deduct stock for PRODUCT items in a transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      const freshProduct = await tx.product.findUnique({ where: { id: itemId } });
      if (!freshProduct || freshProduct.currentStock < quantity) {
        throw new Error(`Stok ${itemName} tidak mencukupi`);
      }
      await tx.product.update({
        where: { id: itemId },
        data: { currentStock: { decrement: quantity } },
      });
      await tx.stockAdjustment.create({
        data: {
          productId: itemId,
          quantity: -quantity,
          reason: "BILLING_SOLD",
          referenceId: billingId,
          notes: `Stok dikurangi untuk billing ${billing.billingNumber}`,
          createdBy: stockUserId,
        },
      });
    });

    const { checkLowStock } = await import("../lib/notifications");
    await checkLowStock(itemId);
  }

  const subtotal = unitPrice * quantity;

  await prisma.billingItem.create({
    data: {
      billingId,
      itemType: itemType as any,
      serviceId: itemType === "SERVICE" ? itemId : null,
      drugId: itemType === "DRUG" ? itemId : null,
      productId: itemType === "PRODUCT" ? itemId : null,
      quantity,
      unitPrice,
      subtotal,
      notes,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "BillingItem",
    entityId: billingId,
    changes: { itemName: { old: null, new: itemName }, quantity: { old: null, new: quantity } },
  });

  return { success: true, data: undefined };
}

export async function removeBillingItem(
  billingId: string,
  itemId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!BILLING_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const billing = await prisma.billing.findUnique({ where: { id: billingId } });
  if (!billing || billing.status !== "OPEN") {
    return { success: false, error: { message: "Hanya billing OPEN yang bisa dihapus itemnya", code: "BUSINESS_RULE" } };
  }

  // Verify item belongs to this billing
  const billingItem = await prisma.billingItem.findUnique({ where: { id: itemId } });
  if (!billingItem || billingItem.billingId !== billingId) {
    return { success: false, error: { message: "Item tidak ditemukan dalam billing ini", code: "NOT_FOUND" } };
  }

  // Restore stock if the item is a PRODUCT
  if (billingItem.productId) {
    await prisma.product.update({
      where: { id: billingItem.productId },
      data: { currentStock: { increment: billingItem.quantity } },
    });

    await prisma.stockAdjustment.create({
      data: {
        productId: billingItem.productId,
        quantity: billingItem.quantity,
        reason: "OPNAME_ADJUST",
        referenceId: billingId,
        notes: "Pengembalian stok karena item billing dihapus",
        createdBy: session.user.id!,
      },
    });
  }

  await prisma.billingItem.delete({ where: { id: itemId } });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "BillingItem",
    entityId: billingId,
    changes: { itemId: { old: itemId, new: null } },
  });

  return { success: true, data: undefined };
}

export async function completeBilling(id: string): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!BILLING_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const billing = await prisma.billing.findUnique({
    where: { id },
    include: {
      billingItems: {
        include: { service: true, drug: true, product: true },
      },
      customer: { select: { id: true, name: true, email: true, userId: true } },
      pet: { select: { name: true } },
    },
  });

  if (!billing) {
    return { success: false, error: { message: "Billing tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (billing.status !== "OPEN") {
    return { success: false, error: { message: "Hanya billing OPEN yang bisa diselesaikan", code: "BUSINESS_RULE" } };
  }

  if (billing.billingItems.length === 0) {
    return { success: false, error: { message: "Billing harus memiliki minimal 1 item", code: "BUSINESS_RULE" } };
  }

  const now = new Date();
  const subtotal = billing.billingItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const taxSetting = await prisma.setting.findUnique({ where: { key: "tax_config" } });
  const taxConfig = taxSetting?.value as any;
  let taxAmount = 0;
  if (taxConfig?.enabled) {
    if (taxConfig.type === "PERCENTAGE") {
      taxAmount = subtotal * (taxConfig.value / 100);
    } else {
      taxAmount = taxConfig.value;
    }
  }

  const total = subtotal + taxAmount;
  const invoiceNumber = generateInvoiceNumber(now);

  // Create invoice + update billing status in transaction
  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: billing.customerId,
        petId: billing.petId,
        sourceType: "BILLING",
        sourceId: id,
        invoiceDate: now,
        subtotal,
        taxAmount,
        total,
        paidAmount: 0,
        status: "UNPAID",
        invoiceItems: {
          create: billing.billingItems.map((item) => {
            let itemName = "Produk";
            if (item.serviceId) itemName = item.service?.name || "Layanan";
            else if (item.drugId) itemName = item.drug?.name || "Obat";
            else if (item.productId) itemName = item.product?.name || "Produk";
            return {
              itemName,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
              category: item.itemType,
            };
          }),
        },
      },
    });

    await tx.billing.update({
      where: { id },
      data: {
        status: "COMPLETED",
        billingEndDate: now,
      },
    });

    return { invoiceId: invoice.id };
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Billing",
    entityId: id,
    changes: {
      status: { old: "OPEN", new: "COMPLETED" },
      invoiceNumber: { old: null, new: invoiceNumber },
    },
  });

  // Notify customer
  if (billing.customer.userId) {
    await createNotification({
      userId: billing.customer.userId,
      title: "Billing Selesai",
      message: `Billing ${billing.billingNumber} untuk ${billing.pet.name} telah selesai. Invoice ${invoiceNumber} telah dibuat.`,
      type: "info",
    });
  }

  if (billing.customer.email) {
    try {
      const { sendEmail, generateInvoiceEmail } = await import("../lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendEmail({
        to: billing.customer.email,
        subject: `Invoice Baru - ${invoiceNumber}`,
        html: generateInvoiceEmail({
          customerName: billing.customer.name,
          invoiceNumber,
          total,
          invoiceUrl: `${appUrl}/portal/invoices/${result.invoiceId}`,
        }),
      });
    } catch (error) {
      console.error("Failed to send billing completion email:", error);
    }
  }

  return { success: true, data: result.invoiceId };
}
