import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getVisits({
  page = 1,
  search = "",
  status,
  customerId,
  petId,
  dateFrom,
  dateTo,
}: {
  page?: number;
  search?: string;
  status?: string;
  customerId?: string;
  petId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const client = await prisma();
  const where: any = {};

  if (search) {
    where.OR = [
      { visitNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { diagnosis: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (petId) where.petId = petId;
  if (dateFrom || dateTo) {
    where.visitDate = {};
    if (dateFrom) where.visitDate.gte = new Date(dateFrom);
    if (dateTo) where.visitDate.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    client.visit.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { id: true, name: true, species: true } },
        creator: { select: { id: true, name: true } },
        visitItems: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.visit.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getVisitById(id: string) {
  const client = await prisma();
  return client.visit.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      creator: { select: { id: true, name: true } },
      visitItems: {
        include: {
          service: true,
          drug: true,
        },
      },
      prescription: {
        include: { prescriptionItems: { include: { drug: true } } },
      },
    } as any,
  }) as any;
}
