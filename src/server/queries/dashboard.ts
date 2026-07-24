import prisma from "../lib/prisma";

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayVisits, todayRevenue, pendingPayments, lowStockProducts] =
    await Promise.all([
      prisma.visit.count({
        where: { visitDate: { gte: today, lt: tomorrow } },
      }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, status: "PAID" },
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
    include: { receiver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { recentVisits, recentPayments };
}

export async function getPendingActions() {
  const [unpaidInvoices, incompleteVisits, lowStockProducts] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["UNPAID", "PARTIAL"] } },
      include: { customer: { select: { name: true } } },
      orderBy: { invoiceDate: "asc" },
      take: 5,
    }),
    prisma.visit.findMany({
      where: { status: "DRAFT" },
      include: {
        customer: { select: { name: true } },
        pet: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", currentStock: { lt: prisma.product.fields.reorderPoint } },
      select: { id: true, name: true, currentStock: true, reorderPoint: true },
      take: 5,
    }),
  ]);

  return { unpaidInvoices, incompleteVisits, lowStockProducts };
}

export async function getVisitChart7Days() {
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const count = await prisma.visit.count({
      where: { visitDate: { gte: startOfDay, lt: endOfDay } },
    });

    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
    days.push({ label, value: count });
  }
  return days;
}

export async function getRevenueChart30Days() {
  const days: { label: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const result = await prisma.payment.aggregate({
      where: { createdAt: { gte: startOfDay, lt: endOfDay }, status: "PAID" },
      _sum: { amount: true },
    });

    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
    days.push({ label, value: Number(result._sum.amount || 0) });
  }
  return days;
}
