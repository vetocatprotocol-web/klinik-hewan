"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult, PendingApprovalsData } from "@/types";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";
import { Prisma } from "@prisma/client";

export async function getPendingApprovals(): Promise<ActionResult<PendingApprovalsData>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengakses persetujuan", code: "FORBIDDEN" } };
  }

  const [serviceChanges, drugChanges, productChanges, stockApprovals, discountLogs, supplierChanges] =
    await Promise.all([
      client.serviceChangeRequest.findMany({
        where: { status: "PENDING" },
        include: { service: { select: { name: true } }, requester: { select: { name: true } } },
        orderBy: { requestedAt: "desc" },
      }),
      client.drugChangeRequest.findMany({
        where: { status: "PENDING" },
        include: { drug: { select: { name: true } }, requester: { select: { name: true } } },
        orderBy: { requestedAt: "desc" },
      }),
      client.productChangeRequest.findMany({
        where: { status: "PENDING" },
        include: { product: { select: { name: true } }, requester: { select: { name: true } } },
        orderBy: { requestedAt: "desc" },
      }),
      client.stockAdjustmentApproval.findMany({
        where: { status: "PENDING" },
        include: {
          adjustment: { include: { product: { select: { name: true } } } },
          requester: { select: { name: true } },
        },
        orderBy: { requestedAt: "desc" },
      }),
      client.discountLog.findMany({
        where: { requiresApproval: true, approvalStatus: "PENDING" },
        include: {
          invoice: { select: { invoiceNumber: true } },
          applier: { select: { name: true } },
        },
        orderBy: { appliedAt: "desc" },
      }),
      client.supplierChangeRequest.findMany({
        where: { status: "PENDING" },
        include: { supplier: { select: { name: true } }, requester: { select: { name: true } } },
        orderBy: { requestedAt: "desc" },
      }),
    ]);

  return {
    success: true,
    data: {
      serviceChanges,
      drugChanges,
      productChanges,
      stockApprovals,
      discountLogs,
      supplierChanges,
    },
  };
}

export async function approvePriceChange(
  changeRequestId: string,
  entityType: "service" | "drug" | "product",
  notes?: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menyetujui perubahan harga", code: "FORBIDDEN" } };
  }

  if (entityType === "service") {
    const request = await client.serviceChangeRequest.findUnique({
      where: { id: changeRequestId },
      include: { service: true },
    });

    if (!request) {
      return { success: false, error: { message: "Permintaan perubahan tidak ditemukan", code: "NOT_FOUND" } };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
    }

    await client.$transaction([
      client.service.update({
        where: { id: request.serviceId },
        data: { price: request.newPrice },
      }),
      client.serviceChangeRequest.update({
        where: { id: changeRequestId },
        data: {
          status: "APPROVED",
          approvedBy: session.user.id!,
          approvedAt: new Date(),
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Service",
      entityId: request.serviceId,
      changes: {
        price: { old: Number(request.oldPrice), new: Number(request.newPrice) },
      },
    });
  } else if (entityType === "drug") {
    const request = await client.drugChangeRequest.findUnique({
      where: { id: changeRequestId },
      include: { drug: true },
    });

    if (!request) {
      return { success: false, error: { message: "Permintaan perubahan tidak ditemukan", code: "NOT_FOUND" } };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
    }

    await client.$transaction([
      client.drug.update({
        where: { id: request.drugId },
        data: { pricePerUnit: request.newPrice },
      }),
      client.drugChangeRequest.update({
        where: { id: changeRequestId },
        data: {
          status: "APPROVED",
          approvedBy: session.user.id!,
          approvedAt: new Date(),
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Drug",
      entityId: request.drugId,
      changes: {
        pricePerUnit: { old: Number(request.oldPrice), new: Number(request.newPrice) },
      },
    });
  } else if (entityType === "product") {
    const request = await client.productChangeRequest.findUnique({
      where: { id: changeRequestId },
      include: { product: true },
    });

    if (!request) {
      return { success: false, error: { message: "Permintaan perubahan tidak ditemukan", code: "NOT_FOUND" } };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
    }

    await client.$transaction([
      client.product.update({
        where: { id: request.productId },
        data: { price: request.newPrice },
      }),
      client.productChangeRequest.update({
        where: { id: changeRequestId },
        data: {
          status: "APPROVED",
          approvedBy: session.user.id!,
          approvedAt: new Date(),
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: request.productId,
      changes: {
        price: { old: Number(request.oldPrice), new: Number(request.newPrice) },
      },
    });
  }

  return { success: true, data: undefined };
}

export async function rejectPriceChange(
  changeRequestId: string,
  entityType: "service" | "drug" | "product",
  reason: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menolak perubahan harga", code: "FORBIDDEN" } };
  }

  let request: { status: string; requestedBy?: string } | null = null;
  if (entityType === "service") {
    request = await client.serviceChangeRequest.findUnique({ where: { id: changeRequestId } });
    if (!request) {
      return { success: false, error: { message: "Permintaan perubahan tidak ditemukan", code: "NOT_FOUND" } };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
    }
    await client.serviceChangeRequest.update({
      where: { id: changeRequestId },
      data: { status: "REJECTED", approvedBy: session.user.id!, approvedAt: new Date() },
    });
  } else if (entityType === "drug") {
    request = await client.drugChangeRequest.findUnique({ where: { id: changeRequestId } });
    if (!request) {
      return { success: false, error: { message: "Permintaan perubahan tidak ditemukan", code: "NOT_FOUND" } };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
    }
    await client.drugChangeRequest.update({
      where: { id: changeRequestId },
      data: { status: "REJECTED", approvedBy: session.user.id!, approvedAt: new Date() },
    });
  } else if (entityType === "product") {
    request = await client.productChangeRequest.findUnique({ where: { id: changeRequestId } });
    if (!request) {
      return { success: false, error: { message: "Permintaan perubahan tidak ditemukan", code: "NOT_FOUND" } };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
    }
    await client.productChangeRequest.update({
      where: { id: changeRequestId },
      data: { status: "REJECTED", approvedBy: session.user.id!, approvedAt: new Date() },
    });
  }

  if (request?.requestedBy) {
    const requester = await client.user.findUnique({
      where: { id: request.requestedBy },
      select: { id: true },
    });
    if (requester) {
      await createNotification({
        userId: requester.id,
        title: "Perubahan Harga Ditolak",
        message: `Perubahan harga ditolak oleh Owner. Alasan: ${reason}`,
        type: "warning",
      });
    }
  }

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: `${entityType}ChangeRequest`,
    entityId: changeRequestId,
    changes: {
      status: { old: "PENDING", new: "REJECTED" },
      reason: { old: null, new: reason },
    },
  });

  return { success: true, data: undefined };
}

export async function approveStockAdjustment(
  adjustmentId: string,
  notes?: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menyetujui penyesuaian stok", code: "FORBIDDEN" } };
  }

  const approval = await client.stockAdjustmentApproval.findUnique({
    where: { id: adjustmentId },
    include: { adjustment: true },
  });

  if (!approval) {
    return { success: false, error: { message: "Permintaan penyesuaian stok tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (approval.status !== "PENDING") {
    return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
  }

  const product = await client.product.findUnique({
    where: { id: approval.adjustment.productId },
  });

  if (!product) {
    return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  const newStock = product.currentStock + approval.quantity;
  if (newStock < 0) {
    return { success: false, error: { message: "Stok tidak boleh negatif", code: "BUSINESS_RULE" } };
  }

  await client.$transaction([
    client.stockAdjustment.update({
      where: { id: approval.adjustmentId },
      data: { notes: notes || approval.notes },
    }),
    client.stockAdjustmentApproval.update({
      where: { id: adjustmentId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id!,
        approvedAt: new Date(),
        notes: notes || undefined,
      },
    }),
    client.product.update({
      where: { id: approval.adjustment.productId },
      data: { currentStock: newStock },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "StockAdjustment",
    entityId: approval.adjustmentId,
    changes: {
      stock: { old: product.currentStock, new: newStock },
      quantity: { old: 0, new: approval.quantity },
    },
  });

  return { success: true, data: undefined };
}

export async function rejectStockAdjustment(
  adjustmentId: string,
  reason: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menolak penyesuaian stok", code: "FORBIDDEN" } };
  }

  const approval = await client.stockAdjustmentApproval.findUnique({
    where: { id: adjustmentId },
  });

  if (!approval) {
    return { success: false, error: { message: "Permintaan penyesuaian stok tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (approval.status !== "PENDING") {
    return { success: false, error: { message: "Permintaan sudah diproses", code: "BUSINESS_RULE" } };
  }

  await client.stockAdjustmentApproval.update({
    where: { id: adjustmentId },
    data: {
      status: "REJECTED",
      approvedBy: session.user.id!,
      approvedAt: new Date(),
      notes: reason,
    },
  });

  if (approval.requestedBy) {
    const requester = await client.user.findUnique({
      where: { id: approval.requestedBy },
      select: { id: true },
    });
    if (requester) {
      await createNotification({
        userId: requester.id,
        title: "Penyesuaian Stok Ditolak",
        message: `Penyesuaian stok ditolak oleh Owner. Alasan: ${reason}`,
        type: "warning",
      });
    }
  }

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "StockAdjustmentApproval",
    entityId: adjustmentId,
    changes: {
      status: { old: "PENDING", new: "REJECTED" },
      reason: { old: null, new: reason },
    },
  });

  return { success: true, data: undefined };
}

export async function approveDiscount(
  discountId: string,
  notes?: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menyetujui diskon", code: "FORBIDDEN" } };
  }

  const discount = await client.discountLog.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    return { success: false, error: { message: "Diskon tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (discount.approvalStatus !== "PENDING") {
    return { success: false, error: { message: "Diskon sudah diproses", code: "BUSINESS_RULE" } };
  }

  await client.discountLog.update({
    where: { id: discountId },
    data: {
      approvalStatus: "APPROVED",
      approvedBy: session.user.id!,
      approvedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "DiscountLog",
    entityId: discountId,
    changes: {
      approvalStatus: { old: "PENDING", new: "APPROVED" },
    },
  });

  return { success: true, data: undefined };
}

export async function rejectDiscount(
  discountId: string,
  reason: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menolak diskon", code: "FORBIDDEN" } };
  }

  const discount = await client.discountLog.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    return { success: false, error: { message: "Diskon tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (discount.approvalStatus !== "PENDING") {
    return { success: false, error: { message: "Diskon sudah diproses", code: "BUSINESS_RULE" } };
  }

  await client.discountLog.update({
    where: { id: discountId },
    data: {
      approvalStatus: "REJECTED",
      approvedBy: session.user.id!,
      approvedAt: new Date(),
    },
  });

  const applier = await client.user.findUnique({
    where: { id: discount.appliedBy },
    select: { id: true },
  });

  if (applier) {
    await createNotification({
      userId: applier.id,
      title: "Diskon Ditolak",
      message: `Diskon sebesar Rp ${Number(discount.discountAmount).toLocaleString("id-ID")} ditolak oleh Owner. Alasan: ${reason}`,
      type: "warning",
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "DiscountLog",
    entityId: discountId,
    changes: {
      approvalStatus: { old: "PENDING", new: "REJECTED" },
      reason: { old: null, new: reason },
    },
  });

  return { success: true, data: undefined };
}

export async function getApprovalHistory({
  status,
  type,
  page = 1,
  pageSize = 20,
}: {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  type?: "service" | "drug" | "product" | "stock" | "discount" | "supplier";
  page?: number;
  pageSize?: number;
}): Promise<{ data: unknown[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }

  const buildWhere = (extra?: Record<string, string | undefined>) => {
    const w: Record<string, string | undefined> = {};
    if (status) w.status = status;
    if (extra) Object.assign(w, extra);
    return w;
  };

  const types = type ? [type] : ["service", "drug", "product", "stock", "discount", "supplier"];
  const allResults: Array<{ requestedAt?: Date; appliedAt?: Date; createdAt?: Date; _type?: string; [key: string]: unknown }> = [];

  for (const t of types) {
    switch (t) {
      case "service": {
        const items = await client.serviceChangeRequest.findMany({
          where: buildWhere(),
          include: { service: { select: { name: true } }, requester: { select: { name: true } } },
          orderBy: { requestedAt: "desc" },
        });
        allResults.push(...items.map((i) => ({ ...i, _type: "service" })));
        break;
      }
      case "drug": {
        const items = await client.drugChangeRequest.findMany({
          where: buildWhere(),
          include: { drug: { select: { name: true } }, requester: { select: { name: true } } },
          orderBy: { requestedAt: "desc" },
        });
        allResults.push(...items.map((i) => ({ ...i, _type: "drug" })));
        break;
      }
      case "product": {
        const items = await client.productChangeRequest.findMany({
          where: buildWhere(),
          include: { product: { select: { name: true } }, requester: { select: { name: true } } },
          orderBy: { requestedAt: "desc" },
        });
        allResults.push(...items.map((i) => ({ ...i, _type: "product" })));
        break;
      }
      case "stock": {
        const items = await client.stockAdjustmentApproval.findMany({
          where: buildWhere(),
          include: {
            adjustment: { include: { product: { select: { name: true } } } },
            requester: { select: { name: true } },
          },
          orderBy: { requestedAt: "desc" },
        });
        allResults.push(...items.map((i) => ({ ...i, _type: "stock" })));
        break;
      }
      case "discount": {
        const w: Prisma.DiscountLogWhereInput = {
          ...(status && { approvalStatus: status as Prisma.EnumApprovalStatusFilter["equals"] }),
        };
        const items = await client.discountLog.findMany({
          where: w,
          include: {
            invoice: { select: { invoiceNumber: true } },
            applier: { select: { name: true } },
          },
          orderBy: { appliedAt: "desc" },
        });
        allResults.push(...items.map((i) => ({ ...i, _type: "discount" })));
        break;
      }
      case "supplier": {
        const items = await client.supplierChangeRequest.findMany({
          where: buildWhere(),
          include: { supplier: { select: { name: true } }, requester: { select: { name: true } } },
          orderBy: { requestedAt: "desc" },
        });
        allResults.push(...items.map((i) => ({ ...i, _type: "supplier" })));
        break;
      }
    }
  }

  allResults.sort((a, b) => {
    const dateA = new Date((a.requestedAt || a.appliedAt || a.createdAt || new Date()) as Date);
    const dateB = new Date((b.requestedAt || b.appliedAt || b.createdAt || new Date()) as Date);
    return dateB.getTime() - dateA.getTime();
  });

  const total = allResults.length;
  const start = (page - 1) * pageSize;
  const data = allResults.slice(start, start + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
