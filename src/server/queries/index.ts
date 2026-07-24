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

export async function getDrugs({
  page = 1,
  search = "",
  status,
}: {
  page?: number;
  search?: string;
  status?: string;
}) {
  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.drug.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.drug.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getActiveDrugs() {
  return prisma.drug.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

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
  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductCategories() {
  return prisma.productCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

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
    prisma.invoice.findMany({
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
    prisma.invoice.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      invoiceItems: true,
    } as any,
  }) as any;
}

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
    prisma.billing.findMany({
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
    prisma.billing.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getBillingById(id: string) {
  return prisma.billing.findUnique({
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

export async function getPosOrders({
  page = 1,
  dateFrom,
  dateTo,
}: {
  page?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const where: any = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    prisma.posOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        posOrderItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.posOrder.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

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

export async function getSettings() {
  const settings = await prisma.setting.findMany();
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, any>);
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getStockAdjustments({
  page = 1,
  productId,
}: {
  page?: number;
  productId?: string;
}) {
  const where: any = {};
  if (productId) where.productId = productId;

  const [data, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        product: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayVisits, todayRevenue, pendingPayments, lowStockProducts] =
    await Promise.all([
      prisma.visit.count({
        where: {
          visitDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: "PAID",
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { status: { in: ["UNPAID", "PARTIAL"] } },
      }),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM products WHERE status = 'ACTIVE' AND current_stock <= reorder_point`.then(
        (result: any) => result[0]?.count ?? 0
      ),
    ]);

  return {
    todayVisits,
    todayRevenue: Number(todayRevenue._sum.amount || 0),
    pendingPayments,
    lowStockProducts: Number(lowStockProducts),
  };
}

export async function getRecentTransactions() {
  const recentVisits = await prisma.visit.findMany({
    include: {
      customer: { select: { name: true } },
      pet: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentPayments = await prisma.payment.findMany({
    include: {
      receiver: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { recentVisits, recentPayments };
}

export async function getAuditLogs({
  page = 1,
  action,
  entityType,
  dateFrom,
  dateTo,
}: {
  page?: number;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const where: any = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}
