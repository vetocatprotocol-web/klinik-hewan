import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { PAGE_SIZE } from "@/lib/constants";

export async function getPrescriptions({
  page = 1,
  search = "",
  customerId,
}: {
  page?: number;
  search?: string;
  customerId?: string;
}) {
  const cacheKey = `prescriptions:${page}:${search}:${customerId}`;
  return cached(cacheKey, async () => {
    const client = await prisma();
    const where: any = {};
    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      client.prescription.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          pet: { select: { name: true, species: true } },
          _count: { select: { prescriptionItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.prescription.count({ where }),
    ]);

    return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }, 10_000);
}

export async function getPrescriptionById(id: string) {
  const client = await prisma();
  return client.prescription.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      pet: { select: { name: true, species: true, breed: true } },
      prescriptionItems: { include: { drug: true } },
      visit: { select: { visitNumber: true, diagnosis: true } },
    },
  });
}
