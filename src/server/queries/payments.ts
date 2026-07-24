import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getPayments({
  page = 1,
  search = "",
}: {
  page?: number;
  search?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    client.payment.findMany({
      where,
      include: { receiver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.payment.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}
