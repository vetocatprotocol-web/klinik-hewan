import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getAuditLogs({
  page = 1,
  action,
  entityType,
  dateFrom,
  dateTo,
}: {
  page?: number;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const client = await prisma();
  const where: any = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    client.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.auditLog.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}
