import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { PAGE_SIZE } from "@/lib/constants";

export async function getProducts({
  page = 1,
  search = "",
  categoryId,
  status,
}: {
  page?: number;
  search?: string;
  categoryId?: string;
  status?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    client.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.product.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getActiveProducts() {
  return cached("products:active", async () => {
    const client = await prisma();
    return client.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }, 30_000); // cache 30s
}

export async function getProductCategories() {
  return cached("products:categories", async () => {
    const client = await prisma();
    return client.productCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  }, 60_000); // cache 60s — categories change rarely
}
