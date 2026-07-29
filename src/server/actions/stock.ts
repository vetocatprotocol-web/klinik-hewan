"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { stockAdjustmentSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import { Prisma } from "@prisma/client";

export async function adjustStock(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER" && role !== "KASIR") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    productId: formData.get("productId") as string,
    quantity: Number(formData.get("quantity")),
    reason: formData.get("reason") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const validated = stockAdjustmentSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const product = await client.product.findUnique({ where: { id: data.productId } });
  if (!product) {
    return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  const newStock = product.currentStock + data.quantity;
  if (newStock < 0) {
    return { success: false, error: { message: "Stok tidak boleh negatif", code: "BUSINESS_RULE" } };
  }

  await client.$transaction([
    client.product.update({
      where: { id: data.productId },
      data: { currentStock: newStock },
    }),
    client.stockAdjustment.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        reason: data.reason as "INITIAL" | "POS_SOLD" | "BILLING_SOLD" | "DAMAGED" | "RETURN" | "OPNAME_ADJUST" | "OTHER",
        notes: data.notes,
        createdBy: session.user.id!,
      },
    }),
  ]);

  const { checkLowStock } = await import("../lib/notifications");
  await checkLowStock(data.productId);

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "StockAdjustment",
    entityId: data.productId,
    changes: {
      stock: { old: product.currentStock, new: newStock },
      reason: { old: null, new: data.reason },
    },
  });

  return { success: true, data: undefined };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getInventory(): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const products = await client.product.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return { success: true, data: products };
}

export async function getStockHistory(
  productId: string,
  dateFrom?: string,
  dateTo?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER" && role !== "KASIR") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const product = await client.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  const where: Prisma.StockAdjustmentWhereInput = {
    productId,
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    } : {}),
  };

  const adjustments = await client.stockAdjustment.findMany({
    where,
    include: { creator: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: adjustments };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStockAdjustmentRequests(): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER" && role !== "KASIR") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const requests = await client.stockAdjustmentApproval.findMany({
    where: { status: "PENDING" },
    include: {
      adjustment: { include: { product: { select: { id: true, name: true } } } },
      requester: { select: { id: true, name: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return { success: true, data: requests };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLowStockAlerts(): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const products = await client.product.findMany({
    where: { status: "ACTIVE" },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { currentStock: "asc" },
  });

  const lowStock = products.filter((p) => p.currentStock <= p.reorderPoint);

  return { success: true, data: lowStock };
}

export async function recordStockOpname(
  products: Array<{ productId: string; physicalCount: number }>
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER" && role !== "KASIR") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  if (!products || products.length === 0) {
    return { success: false, error: { message: "Data produk tidak boleh kosong", code: "BUSINESS_RULE" } };
  }

  const productIds = products.map((p) => p.productId);
  const existingProducts = await client.product.findMany({
    where: { id: { in: productIds } },
  });

  if (existingProducts.length !== products.length) {
    return { success: false, error: { message: "Beberapa produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  const adjustments: ReturnType<typeof client.stockAdjustment.create>[] = [];
  const productUpdates: ReturnType<typeof client.product.update>[] = [];

  for (const item of products) {
    const product = existingProducts.find((p) => p.id === item.productId)!;
    const variance = item.physicalCount - product.currentStock;

    if (variance !== 0) {
      adjustments.push(
        client.stockAdjustment.create({
          data: {
            productId: item.productId,
            quantity: variance,
            reason: "OPNAME_ADJUST",
            notes: `Opname: sistem ${product.currentStock}, fisik ${item.physicalCount}`,
            createdBy: session.user.id!,
          },
        })
      );
      productUpdates.push(
        client.product.update({
          where: { id: item.productId },
          data: { currentStock: item.physicalCount },
        })
      );
    }
  }

  if (adjustments.length === 0) {
    return { success: true, data: undefined };
  }

  await client.$transaction([...productUpdates, ...adjustments]);

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "StockAdjustment",
    entityId: products[0].productId,
    changes: {
      opname: { old: null, new: `${products.length} produk diperiksa, ${adjustments.length} disesuaikan` },
    },
  });

  return { success: true, data: undefined };
}
