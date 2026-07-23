"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { ActionResult } from "@/types";
import { generateOrderNumber, generatePaymentNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { InsufficientStockError } from "@/lib/errors";

export async function createPosOrder(
  customerId?: string
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
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

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (product.currentStock < quantity) {
    return {
      success: false,
      error: { message: `Stok tidak mencukupi. Tersedia: ${product.currentStock}`, code: "INSUFFICIENT_STOCK" },
    };
  }

  const subtotal = Number(product.price) * quantity;

  await prisma.posOrderItem.create({
    data: {
      posOrderId: orderId,
      productId,
      quantity,
      unitPrice: Number(product.price),
      subtotal,
    },
  });

  // Update order totals
  const items = await prisma.posOrderItem.findMany({ where: { posOrderId: orderId } });
  const orderSubtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  // Get tax config
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

  const order = await prisma.posOrder.findUnique({
    where: { id: orderId },
    include: { posOrderItems: { include: { product: true } } },
  });

  if (!order) {
    return { success: false, error: { message: "Pesanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  const total = Number(order.total) - discountAmount;
  if (paymentAmount < total) {
    return { success: false, error: { message: "Jumlah pembayaran kurang", code: "INVALID_PAYMENT" } };
  }

  const changeAmount = paymentAmount - total;

  // Deduct stock
  await prisma.$transaction(async (tx) => {
    for (const item of order.posOrderItems) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.currentStock < item.quantity) {
        throw new Error(`Stok ${item.product.name} tidak mencukupi`);
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
          createdBy: session.user.id!,
        },
      });
    }
  });

  await prisma.posOrder.update({
    where: { id: orderId },
    data: {
      discountAmount,
      total,
      paymentMethod,
      paymentAmount,
      changeAmount,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "PAYMENT",
    entityType: "PosOrder",
    entityId: orderId,
  });

  return { success: true, data: undefined };
}
