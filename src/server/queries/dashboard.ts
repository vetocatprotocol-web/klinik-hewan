import { prisma } from "../lib/prisma";

export async function getDashboardStats() {
  const client = await prisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayVisits, todayRevenue, pendingPayments, lowStockProducts] =
    await Promise.all([
      client.visit.count({
        where: { visitDate: { gte: today, lt: tomorrow } },
      }),
      client.payment.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, status: "PAID" },
        _sum: { amount: true },
      }),
      client.invoice.count({
        where: { status: { in: ["UNPAID", "PARTIAL"] } },
      }),
      client.$queryRaw`SELECT COUNT(*)::int as count FROM products WHERE status = 'ACTIVE' AND current_stock <= reorder_point`.then(
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
  const client = await prisma();
  const recentVisits = await client.visit.findMany({
    include: {
      customer: { select: { name: true } },
      pet: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentPayments = await client.payment.findMany({
    include: { receiver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { recentVisits, recentPayments };
}

export async function getPendingActions() {
  const client = await prisma();
  const [unpaidInvoices, incompleteVisits, lowStockRows] = await Promise.all([
    client.invoice.findMany({
      where: { status: { in: ["UNPAID", "PARTIAL"] } },
      include: { customer: { select: { name: true } } },
      orderBy: { invoiceDate: "asc" },
      take: 5,
    }),
    client.visit.findMany({
      where: { status: "DRAFT" },
      include: {
        customer: { select: { name: true } },
        pet: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    client.$queryRaw<{ id: string; name: string; currentStock: number; reorderPoint: number }[]>`
      SELECT id, name, current_stock as "currentStock", reorder_point as "reorderPoint"
      FROM products
      WHERE status = 'ACTIVE' AND current_stock < reorder_point
      ORDER BY (current_stock::float / NULLIF(reorder_point, 0)) ASC
      LIMIT 5
    `,
  ]);

  const lowStockProducts = lowStockRows.map((r) => ({
    ...r,
    currentStock: Number(r.currentStock),
    reorderPoint: Number(r.reorderPoint),
  }));

  return { unpaidInvoices, incompleteVisits, lowStockProducts };
}

export async function getVisitChart7Days() {
  const client = await prisma();
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const rows: { day: Date; count: number }[] = await client.$queryRaw`
    SELECT DATE(visit_date) as day, COUNT(*)::int as count
    FROM visits
    WHERE visit_date >= ${start}
    GROUP BY DATE(visit_date)
    ORDER BY day ASC
  `;

  const countMap = new Map<string, number>();
  for (const row of rows) {
    countMap.set(new Date(row.day).toISOString().slice(0, 10), row.count);
  }

  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
    days.push({ label, value: countMap.get(key) || 0 });
  }
  return days;
}

export async function getRevenueChart30Days() {
  const client = await prisma();
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const rows: { day: Date; total: number }[] = await client.$queryRaw`
    SELECT DATE(created_at) as day, COALESCE(SUM(amount), 0)::numeric as total
    FROM payments
    WHERE created_at >= ${start} AND status = 'PAID'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `;

  const revenueMap = new Map<string, number>();
  for (const row of rows) {
    revenueMap.set(new Date(row.day).toISOString().slice(0, 10), Number(row.total));
  }

  const days: { label: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
    days.push({ label, value: revenueMap.get(key) || 0 });
  }
  return days;
}
