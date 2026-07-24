"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { ActionResult } from "@/types";
import { generateOrderNumber, generatePaymentNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { InsufficientStockError } from "@/lib/errors";

const POS_ROLES = ["OWNER", "KASIR"];

export async function createPosOrder(
  customerId?: string
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const orderNumber = generateOrderNumber(new Date());

  const order = await prisma.posOrder.create({
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
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
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

  await prisma.posOrderItem.create({
    data: {
      posOrderId: orderId,
      productId,
      quantity,
      unitPrice,
      subtotal,
    },
  });

  // Update order totals
  const items = await prisma.posOrderItem.findMany({ where: { posOrderId: orderId } });
  const orderSubtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const taxSetting = await prisma.setting.findUnique({ where: { key: "tax_config" } });
  const taxConfig = taxSetting?.value as any;
  let taxAmount = 0;
  if (taxConfig?.enabled) {
    if (taxConfig.type === "PERCENTAGE") {
      taxAmount = orderSubtotal * (taxConfig.value / 100);
    } else {
      taxAmount = taxConfig.value;
    }
  }

  await prisma.posOrder.update({
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
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const order = await prisma.posOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: { message: "Pesanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  // Get item before deletion to restore stock
  const orderItem = await prisma.posOrderItem.findUnique({ where: { id: itemId } });
  if (!orderItem || orderItem.posOrderId !== orderId) {
    return { success: false, error: { message: "Item tidak ditemukan dalam pesanan ini", code: "NOT_FOUND" } };
  }

  // Restore stock for the product
  if (orderItem.productId) {
    await prisma.product.update({
      where: { id: orderItem.productId },
      data: { currentStock: { increment: orderItem.quantity } },
    });

    await prisma.stockAdjustment.create({
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

  await prisma.posOrderItem.delete({ where: { id: itemId } });

  // Update order totals
  const items = await prisma.posOrderItem.findMany({ where: { posOrderId: orderId } });
  const orderSubtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const taxSetting = await prisma.setting.findUnique({ where: { key: "tax_config" } });
  const taxConfig = taxSetting?.value as any;
  let taxAmount = 0;
  if (taxConfig?.enabled) {
    if (taxConfig.type === "PERCENTAGE") {
      taxAmount = orderSubtotal * (taxConfig.value / 100);
    } else {
      taxAmount = taxConfig.value;
    }
  }

  await prisma.posOrder.update({
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
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!POS_ROLES.includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const order = await prisma.posOrder.findUnique({
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

  // Deduct stock + update order in a single transaction
  await prisma.$transaction(async (tx) => {
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
