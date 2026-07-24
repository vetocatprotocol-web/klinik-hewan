import prisma from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getServices({
  page = 1,
  search = "",
  category,
  status,
}: {
  page?: number;
  search?: string;
  category?: string;
  status?: string;
}) {
  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (category) where.category = category;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.service.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getActiveServices() {
  return prisma.service.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}
