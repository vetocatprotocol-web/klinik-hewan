import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getInvoices({
  page = 1,
  search = "",
  status,
  customerId,
  dateFrom,
  dateTo,
}: {
  page?: number;
  search?: string;
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (dateFrom || dateTo) {
    where.invoiceDate = {};
    if (dateFrom) where.invoiceDate.gte = new Date(dateFrom);
    if (dateTo) where.invoiceDate.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    client.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { id: true, name: true } },
        invoiceItems: true,
      } as any,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.invoice.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getInvoiceById(id: string) {
  const client = await prisma();
  return client.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      invoiceItems: true,
    } as any,
  }) as any;
}
