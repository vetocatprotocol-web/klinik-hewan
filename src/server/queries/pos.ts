import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getPosOrders({
  page = 1,
  dateFrom,
  dateTo,
}: {
  page?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    client.posOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        posOrderItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.posOrder.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}
