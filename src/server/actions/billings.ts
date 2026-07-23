"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { billingSchema, billingItemSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { generateBillingNumber, generateInvoiceNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";

export async function createBilling(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
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

  const billing = await prisma.billing.findUnique({ where: { id: billingId } });
  if (!billing) {
    return { success: false, error: { message: "Billing tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (billing.status !== "OPEN") {
    return { success: false, error: { message: "Hanya billing OPEN yang bisa ditambah item", code: "BUSINESS_RULE" } };
  }

  let unitPrice = 0;
  if (itemType === "SERVICE") {
    const service = await prisma.service.findUnique({ where: { id: itemId } });
    if (!service) return { success: false, error: { message: "Layanan tidak ditemukan", code: "NOT_FOUND" } };
    unitPrice = Number(service.price);
  } else if (itemType === "DRUG") {
    const drug = await prisma.drug.findUnique({ where: { id: itemId } });
    if (!drug) return { success: false, error: { message: "Obat tidak ditemukan", code: "NOT_FOUND" } };
    unitPrice = Number(drug.pricePerUnit);
  } else if (itemType === "PRODUCT") {
    const product = await prisma.product.findUnique({ where: { id: itemId } });
    if (!product) return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
    if (product.currentStock < quantity) {
      return { success: false, error: { message: `Stok ${product.name} tidak mencukupi`, code: "INSUFFICIENT_STOCK" } };
    }
    unitPrice = Number(product.price);

    // Deduct stock
    await prisma.product.update({
      where: { id: itemId },
      data: { currentStock: { decrement: quantity } },
    });

    await prisma.stockAdjustment.create({
      data: {
        productId: itemId,
        quantity: -quantity,
        reason: "POS_SOLD",
        referenceId: billingId,
        createdBy: session.user.id!,
      },
    });
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

  const billing = await prisma.billing.findUnique({ where: { id: billingId } });
  if (!billing || billing.status !== "OPEN") {
    return { success: false, error: { message: "Hanya billing OPEN yang bisa dihapus itemnya", code: "BUSINESS_RULE" } };
  }

  await prisma.billingItem.delete({ where: { id: itemId } });

  return { success: true, data: undefined };
}

export async function completeBilling(id: string): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const billing = await prisma.billing.findUnique({
    where: { id },
    include: { billingItems: true },
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
  const invoice = await prisma.invoice.create({
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
        create: billing.billingItems.map((item) => ({
          itemName: item.serviceId ? "Layanan" : item.drugId ? "Obat" : "Produk",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          category: item.itemType,
        })),
      },
    },
  });

  await prisma.billing.update({
    where: { id },
    data: {
      status: "COMPLETED",
      billingEndDate: now,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Billing",
    entityId: id,
    changes: { status: { old: "OPEN", new: "COMPLETED" } },
  });

  return { success: true, data: invoice.id };
}
