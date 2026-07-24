"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { generateOrderNumber, generatePaymentNumber, generateInvoiceNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { InsufficientStockError } from "@/lib/errors";

const POS_ROLES = ["OWNER", "KASIR"];

export async function createPosOrder(
  customerId?: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const orderNumber = generateOrderNumber(new Date());

  const order = await client.posOrder.create({
    data: {
      orderNumber,
      customerId: customerId || null,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 0,
      paymentMethod: "",
      paymentAmount: 0,
      changeAmount: 0,
      status: "COMPLETED",
      createdBy: session.user.id!,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "PosOrder",
    entityId: order.id,
    changes: { orderNumber: { old: null, new: orderNumber } },
  });

  return { success: true, data: order.id };
}

export async function addPosItem(
  orderId: string,
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const product = await client.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "ACTIVE") {
    return { success: false, error: { message: "Produk tidak ditemukan atau tidak aktif", code: "NOT_FOUND" } };
  }

  if (product.currentStock < quantity) {
    return {
      success: false,
      error: { message: `Stok tidak mencukupi. ${product.name} tersedia: ${product.currentStock}`, code: "INSUFFICIENT_STOCK" },
    };
  }

  const unitPrice = Number(product.price);
  const subtotal = unitPrice * quantity;

  await client.posOrderItem.create({
    data: {
      posOrderId: orderId,
      productId,
      quantity,
      unitPrice,
      subtotal,
    },
  });

  // Update order totals
  const items = await client.posOrderItem.findMany({ where: { posOrderId: orderId } });
  const orderSubtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const taxSetting = await client.setting.findUnique({ where: { key: "tax_config" } });
  const taxConfig = taxSetting?.value as any;
  let taxAmount = 0;
  if (taxConfig?.enabled) {
    if (taxConfig.type === "PERCENTAGE") {
      taxAmount = orderSubtotal * (taxConfig.value / 100);
    } else {
      taxAmount = taxConfig.value;
    }
  }

  await client.posOrder.update({
    where: { id: orderId },
    data: {
      subtotal: orderSubtotal,
      taxAmount,
      total: orderSubtotal + taxAmount,
    },
  });

  return { success: true, data: undefined };
}

export async function removePosItem(
  orderId: string,
  itemId: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const order = await client.posOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: { message: "Pesanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  // Get item before deletion to restore stock
  const orderItem = await client.posOrderItem.findUnique({ where: { id: itemId } });
  if (!orderItem || orderItem.posOrderId !== orderId) {
    return { success: false, error: { message: "Item tidak ditemukan dalam pesanan ini", code: "NOT_FOUND" } };
  }

  // Restore stock for the product
  if (orderItem.productId) {
    await client.product.update({
      where: { id: orderItem.productId },
      data: { currentStock: { increment: orderItem.quantity } },
    });

    await client.stockAdjustment.create({
      data: {
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        reason: "RETURN",
        referenceId: orderId,
        notes: "Pengembalian stok karena item POS dihapus dari keranjang",
        createdBy: session.user.id!,
      },
    });
  }

  await client.posOrderItem.delete({ where: { id: itemId } });

  // Update order totals
  const items = await client.posOrderItem.findMany({ where: { posOrderId: orderId } });
  const orderSubtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const taxSetting = await client.setting.findUnique({ where: { key: "tax_config" } });
  const taxConfig = taxSetting?.value as any;
  let taxAmount = 0;
  if (taxConfig?.enabled) {
    if (taxConfig.type === "PERCENTAGE") {
      taxAmount = orderSubtotal * (taxConfig.value / 100);
    } else {
      taxAmount = taxConfig.value;
    }
  }

  await client.posOrder.update({
    where: { id: orderId },
    data: {
      subtotal: orderSubtotal,
      taxAmount,
      total: orderSubtotal + taxAmount,
    },
  });

  return { success: true, data: undefined };
}

export async function checkoutPos(
  orderId: string,
  paymentMethod: string,
  paymentAmount: number,
  discountAmount: number = 0
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const order = await client.posOrder.findUnique({
    where: { id: orderId },
    include: { posOrderItems: { include: { product: true } } },
  });

  if (!order) {
    return { success: false, error: { message: "Pesanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (order.posOrderItems.length === 0) {
    return { success: false, error: { message: "Pesanan kosong", code: "BUSINESS_RULE" } };
  }

  if (discountAmount < 0) {
    return { success: false, error: { message: "Diskon tidak boleh negatif", code: "INVALID_INPUT" } };
  }

  const total = Number(order.subtotal) + Number(order.taxAmount) - discountAmount;
  if (total < 0) {
    return { success: false, error: { message: "Total tidak boleh negatif", code: "INVALID_INPUT" } };
  }

  if (paymentAmount < total) {
    return { success: false, error: { message: `Jumlah pembayaran kurang. Total: ${total.toLocaleString("id-ID")}, Dibayar: ${paymentAmount.toLocaleString("id-ID")}`, code: "INVALID_PAYMENT" } };
  }

  const changeAmount = paymentAmount - total;
  const userId = session.user.id!;

  const { checkLowStock } = await import("../lib/notifications");

  // Deduct stock + create invoice + payment in a single transaction
  await client.$transaction(async (tx) => {
    for (const item of order.posOrderItems) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.currentStock < item.quantity) {
        throw new InsufficientStockError(item.product.name, product?.currentStock || 0);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      await tx.stockAdjustment.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          reason: "POS_SOLD",
          referenceId: orderId,
          createdBy: userId,
        },
      });
    }

    await tx.posOrder.update({
      where: { id: orderId },
      data: {
        discountAmount,
        total,
        paymentMethod,
        paymentAmount,
        changeAmount,
      },
    });

    // PRD §5.2 step 14e: Create Invoice for POS (only if customer linked)
    let invoiceId: string | null = null;
    if (order.customerId) {
      const now = new Date();
      const invoiceNumber = generateInvoiceNumber(now);
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: order.customerId,
          sourceType: "POS",
          sourceId: orderId,
          invoiceDate: now,
          dueDate,
          subtotal: Number(order.subtotal),
          taxAmount: Number(order.taxAmount),
          total,
          paidAmount: paymentAmount,
          status: "PAID",
        },
      });

      invoiceId = invoice.id;

      // Create invoice items from order items
      for (const item of order.posOrderItems) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemName: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            category: "PRODUCT",
          },
        });
      }

      // PRD §5.2 step 14f: Create Payment record
      const paymentNumber = generatePaymentNumber(now);
      await tx.payment.create({
        data: {
          paymentNumber,
          payableType: "Invoice",
          payableId: invoice.id,
          paymentMethod,
          amount: total,
          status: "PAID",
          receivedBy: userId,
        },
      });
    }
  });

  for (const item of order.posOrderItems) {
    await checkLowStock(item.productId);
  }

  await createAuditLog({
    userId: session.user.id,
    action: "PAYMENT",
    entityType: "PosOrder",
    entityId: orderId,
    changes: {
      orderNumber: { old: null, new: order.orderNumber },
      total: { old: null, new: total },
      paymentMethod: { old: null, new: paymentMethod },
      paymentAmount: { old: null, new: paymentAmount },
      changeAmount: { old: null, new: changeAmount },
      discountAmount: { old: null, new: discountAmount },
    },
  });

  return { success: true, data: undefined };
}

interface PosCartItem {
  productId: string;
  quantity: number;
}

interface PosCheckoutInput {
  customerId?: string;
  items: PosCartItem[];
  paymentMethod: string;
  paymentAmount: number;
  discountAmount?: number;
}

export async function processPosTransaction(input: PosCheckoutInput): Promise<ActionResult<{ orderNumber: string; changeAmount: number }>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  if (!input.items || input.items.length === 0) {
    return { success: false, error: { message: "Keranjang kosong", code: "BUSINESS_RULE" } };
  }

  const discountAmount = input.discountAmount || 0;
  if (discountAmount < 0) {
    return { success: false, error: { message: "Diskon tidak boleh negatif", code: "INVALID_INPUT" } };
  }

  const userId = session.user.id!;
  const orderNumber = generateOrderNumber(new Date());
  const { checkLowStock } = await import("../lib/notifications");

  const result = await client.$transaction(async (tx) => {
    // Fetch all products and validate stock
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== "ACTIVE") {
        throw new Error(`Produk ${item.productId} tidak ditemukan atau tidak aktif`);
      }
      if (product.currentStock < item.quantity) {
        throw new InsufficientStockError(product.name, product.currentStock);
      }
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    // Get tax config
    const taxSetting = await tx.setting.findUnique({ where: { key: "tax_config" } });
    const taxConfig = taxSetting?.value as any;
    let taxAmount = 0;
    if (taxConfig?.enabled) {
      if (taxConfig.type === "PERCENTAGE") {
        taxAmount = Math.round(subtotal * (taxConfig.value / 100));
      } else {
        taxAmount = taxConfig.value;
      }
    }

    const total = subtotal + taxAmount - discountAmount;
    if (input.paymentAmount < total) {
      throw new Error(`Jumlah pembayaran kurang. Total: ${total.toLocaleString("id-ID")}, Dibayar: ${input.paymentAmount.toLocaleString("id-ID")}`);
    }

    const changeAmount = input.paymentAmount - total;

    // Create order
    const order = await tx.posOrder.create({
      data: {
        orderNumber,
        customerId: input.customerId || null,
        subtotal,
        taxAmount,
        discountAmount,
        total,
        paymentMethod: input.paymentMethod,
        paymentAmount: input.paymentAmount,
        changeAmount,
        status: "COMPLETED",
        createdBy: userId,
      },
    });

    // Create order items + deduct stock + create stock adjustments
    for (const itemData of orderItemsData) {
      await tx.posOrderItem.create({
        data: {
          posOrderId: order.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          subtotal: itemData.subtotal,
        },
      });

      await tx.product.update({
        where: { id: itemData.productId },
        data: { currentStock: { decrement: itemData.quantity } },
      });

      await tx.stockAdjustment.create({
        data: {
          productId: itemData.productId,
          quantity: -itemData.quantity,
          reason: "POS_SOLD",
          referenceId: order.id,
          createdBy: userId,
        },
      });
    }

    // PRD §5.2 step 14e: Create Invoice for POS (only if customer linked)
    if (input.customerId) {
      const now = new Date();
      const invoiceNumber = generateInvoiceNumber(now);
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: input.customerId,
          sourceType: "POS",
          sourceId: order.id,
          invoiceDate: now,
          dueDate,
          subtotal,
          taxAmount,
          total,
          paidAmount: input.paymentAmount,
          status: "PAID",
        },
      });

      // Create invoice items from order items
      for (const itemData of orderItemsData) {
        const product = productMap.get(itemData.productId)!;
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemName: product.name,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            subtotal: itemData.subtotal,
            category: "PRODUCT",
          },
        });
      }

      // PRD §5.2 step 14f: Create Payment record
      const paymentNumber = generatePaymentNumber(now);
      await tx.payment.create({
        data: {
          paymentNumber,
          payableType: "Invoice",
          payableId: invoice.id,
          paymentMethod: input.paymentMethod,
          amount: total,
          status: "PAID",
          receivedBy: userId,
        },
      });
    }

    return { orderId: order.id, orderNumber, changeAmount };
  });

  // Post-transaction: check low stock
  for (const item of input.items) {
    await checkLowStock(item.productId);
  }

  await createAuditLog({
    userId,
    action: "CREATE",
    entityType: "PosOrder",
    entityId: result.orderId,
    changes: {
      orderNumber: { old: null, new: result.orderNumber },
      total: { old: null, new: input.paymentAmount - result.changeAmount },
      paymentMethod: { old: null, new: input.paymentMethod },
    },
  });

  return { success: true, data: { orderNumber: result.orderNumber, changeAmount: result.changeAmount } };
}

export async function downloadReceiptPdf(orderId: string): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const order = await client.posOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: { message: "Pesanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  try {
    const { generateReceiptHtml } = await import("../lib/pdf");
    const html = await generateReceiptHtml(orderId);
    return { success: true, data: html };
  } catch (error) {
    return { success: false, error: { message: "Gagal generate struk", code: "PDF_FAILED" } };
  }
}
