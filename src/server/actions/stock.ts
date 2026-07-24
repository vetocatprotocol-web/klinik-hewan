"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { stockAdjustmentSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

export async function adjustStock(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (role !== "OWNER" && role !== "ADMIN") {
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
        reason: data.reason as any,
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
