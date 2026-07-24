import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getDrugs({
  page = 1,
  search = "",
  status,
}: {
  page?: number;
  search?: string;
  status?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    client.drug.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.drug.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getActiveDrugs() {
  const client = await prisma();
  return client.drug.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}
