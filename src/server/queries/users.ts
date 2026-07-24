import prisma from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getUsers({
  page = 1,
  search = "",
  role,
  status,
}: {
  page?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.roleId = role;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}
