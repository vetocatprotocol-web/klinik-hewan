import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getSuppliers({
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
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    client.supplier.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.supplier.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getSupplierById(id: string) {
  const client = await prisma();
  return client.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      _count: { select: { purchaseOrders: true } },
    },
  });
}

export async function getPurchaseOrders({
  supplierId,
  status,
  page = 1,
}: {
  supplierId?: string;
  status?: string;
  page?: number;
}) {
  const client = await prisma();
  const where: any = {};
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    client.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.purchaseOrder.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getPurchaseOrderById(id: string) {
  const client = await prisma();
  return client.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          product: { select: { id: true, name: true } },
          drug: { select: { id: true, name: true } },
        },
      },
      receipts: true,
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function getSupplierPerformance(supplierId: string) {
  const client = await prisma();

  const supplier = await client.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, name: true },
  });

  if (!supplier) return null;

  const purchaseOrders = await client.purchaseOrder.findMany({
    where: { supplierId },
    include: { items: true, receipts: true },
    orderBy: { createdAt: "desc" },
  });

  const totalPOCount = purchaseOrders.length;
  const totalSpend = purchaseOrders.reduce(
    (sum, po) => sum + Number(po.totalAmount),
    0
  );

  const receivedPOs = purchaseOrders.filter((po) => po.status === "RECEIVED");
  const onTimePOs = receivedPOs.filter((po) => {
    if (!po.requiredDate) return true;
    const lastReceipt = po.receipts[po.receipts.length - 1];
    if (!lastReceipt) return true;
    return new Date(lastReceipt.receivedDate) <= new Date(po.requiredDate);
  });

  const onTimeDeliveryRate = receivedPOs.length > 0
    ? Math.round((onTimePOs.length / receivedPOs.length) * 100)
    : 0;

  const statusBreakdown = {
    pending: purchaseOrders.filter((po) => po.status === "PENDING").length,
    partialReceived: purchaseOrders.filter((po) => po.status === "PARTIAL_RECEIVED").length,
    received: receivedPOs.length,
    cancelled: purchaseOrders.filter((po) => po.status === "CANCELLED").length,
  };

  return {
    supplier,
    totalPOCount,
    totalSpend,
    onTimeDeliveryRate,
    statusBreakdown,
  };
}
