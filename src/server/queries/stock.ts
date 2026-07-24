import prisma from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getStockAdjustments({
  page = 1,
  productId,
}: {
  page?: number;
  productId?: string;
}) {
  const where: any = {};
  if (productId) where.productId = productId;

  const [data, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        product: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}
