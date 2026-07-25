import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getReconciliations({
  page = 1,
  status,
  dateFrom,
  dateTo,
}: {
  page?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    client.dailyReconciliation.findMany({
      where,
      include: {
        kasir: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.dailyReconciliation.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getReconciliationById(id: string) {
  const client = await prisma();
  return client.dailyReconciliation.findUnique({
    where: { id },
    include: {
      kasir: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });
}

export async function getPendingReconciliations() {
  const client = await prisma();
  return client.dailyReconciliation.findMany({
    where: { status: "PENDING" },
    include: {
      kasir: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });
}
