"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { Prisma } from "@prisma/client";

export async function getAuditLogsForExport({
  userId,
  action,
  entityType,
  dateFrom,
  dateTo,
}: {
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {}): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengakses log audit", code: "FORBIDDEN" } };
  }

  const where: Prisma.AuditLogWhereInput = {
    ...(userId && { userId }),
    ...(action && { action: action as Prisma.EnumAuditActionFilter["equals"] }),
    ...(entityType && { entityType }),
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    } : {}),
  };

  const logs = await client.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: logs };
}

export async function getAuditTrailForEntity(
  entityType: string,
  entityId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengakses log audit", code: "FORBIDDEN" } };
  }

  const logs = await client.auditLog.findMany({
    where: { entityType, entityId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: logs };
}

export async function getUserActivity(
  userId: string,
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
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengakses aktivitas pengguna", code: "FORBIDDEN" } };
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return { success: false, error: { message: "Pengguna tidak ditemukan", code: "NOT_FOUND" } };
  }

  const where: Prisma.AuditLogWhereInput = {
    userId,
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    } : {}),
  };

  const [logs, actionCounts] = await Promise.all([
    client.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    client.auditLog.groupBy({
      by: ["action", "entityType"],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    success: true,
    data: {
      user,
      totalActions: logs.length,
      actionBreakdown: actionCounts.map((g) => ({
        action: g.action,
        entityType: g.entityType,
        count: g._count.id,
      })),
      recentLogs: logs.slice(0, 50),
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAnomalyReport(): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengakses laporan anomali", code: "FORBIDDEN" } };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [failedLogins, largeStockAdjustments, highDiscounts] = await Promise.all([
    client.user.findMany({
      where: { failedLoginAttempts: { gte: 3 } },
      select: { id: true, name: true, email: true, failedLoginAttempts: true, lockedUntil: true },
    }),
    client.stockAdjustment.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        OR: [
          { quantity: { gte: 100 } },
          { quantity: { lte: -100 } },
        ],
      },
      include: {
        product: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    client.discountLog.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        discountPercent: { gte: 30 },
      },
      include: {
        invoice: { select: { invoiceNumber: true } },
        applier: { select: { name: true } },
      },
      orderBy: { appliedAt: "desc" },
    }),
  ]);

  return {
    success: true,
    data: {
      failedLogins,
      largeStockAdjustments,
      highDiscounts,
    },
  };
}

export async function searchAuditLogs(
  keywords: string,
  filters: {
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mencari log audit", code: "FORBIDDEN" } };
  }

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.action && { action: filters.action as Prisma.EnumAuditActionFilter["equals"] }),
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.dateFrom || filters.dateTo ? {
      createdAt: {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      }
    } : {}),
  };

  const logs = await client.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const lowerKeywords = keywords.toLowerCase();
  const matched = logs.filter((log) => {
    if (log.changes && typeof log.changes === "object") {
      const changesStr = JSON.stringify(log.changes).toLowerCase();
      if (changesStr.includes(lowerKeywords)) return true;
    }
    if (log.entityType && log.entityType.toLowerCase().includes(lowerKeywords)) return true;
    if (log.entityId && log.entityId.toLowerCase().includes(lowerKeywords)) return true;
    if (log.action && log.action.toLowerCase().includes(lowerKeywords)) return true;
    if (log.user?.name && log.user.name.toLowerCase().includes(lowerKeywords)) return true;
    if (log.user?.email && log.user.email.toLowerCase().includes(lowerKeywords)) return true;
    return false;
  });

  return { success: true, data: matched };
}
