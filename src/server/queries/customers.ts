import prisma from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getCustomers({
  page = 1,
  search = "",
  status,
}: {
  page?: number;
  search?: string;
  status?: string;
}) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        pets: { where: { status: "ACTIVE" } },
        user: { select: { id: true, email: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      pets: { where: { status: "ACTIVE" } },
      user: { select: { id: true, email: true, status: true } },
    },
  });
}

export async function searchCustomers(query: string) {
  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ],
      status: "ACTIVE",
    },
    include: { pets: { where: { status: "ACTIVE" } } },
    take: 10,
    orderBy: { name: "asc" },
  });
}
