import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getBillings({
  page = 1,
  search = "",
  status,
  customerId,
}: {
  page?: number;
  search?: string;
  status?: string;
  customerId?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (search) {
    where.OR = [
      { billingNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [data, total] = await Promise.all([
    client.billing.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { id: true, name: true } },
        billingItems: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.billing.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getBillingById(id: string) {
  const client = await prisma();
  return client.billing.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      creator: { select: { id: true, name: true } },
      billingItems: {
        include: { service: true, drug: true, product: true },
      },
    } as any,
  });
}
