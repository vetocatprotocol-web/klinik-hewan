"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const REPORT_ROLES = ["OWNER", "ADMIN"];

export async function getDailyReport(date?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [visits, payments, lowStockProducts] = await Promise.all([
    client.visit.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      include: {
        _count: { select: { visitItems: true } },
        customer: { select: { name: true } },
        pet: { select: { name: true } },
      },
    }),
    client.payment.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay }, status: "PAID" },
    }),
    client.product.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, currentStock: true, reorderPoint: true },
    }).then((products) => products.filter((p) => p.currentStock < p.reorderPoint)),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    date: startOfDay.toISOString().split("T")[0],
    totalVisits: visits.length,
    totalRevenue,
    totalPayments: payments.length,
    visits,
    payments,
    lowStockProducts,
  };
}

export async function getRevenueReport(startDate: string, endDate: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const payments = await client.payment.findMany({
    where: { createdAt: { gte: start, lte: end }, status: "PAID" },
    orderBy: { createdAt: "asc" },
  });

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const byMethod = payments.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  return { startDate, endDate, totalRevenue, totalPayments: payments.length, byMethod, payments };
}

export async function getInventoryReport() {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const products = await client.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const activeProducts = products.filter((p) => p.status === "ACTIVE");
  const lowStock = activeProducts.filter((p) => p.currentStock < p.reorderPoint);
  const outOfStock = activeProducts.filter((p) => p.currentStock === 0);

  return { products, lowStock, outOfStock, totalProducts: products.length };
}

export async function getCustomerReport() {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  // Use SQL aggregation instead of fetching all relations
  const customerStats: any[] = await client.$queryRaw`
    SELECT
      c.id,
      c.name,
      c.phone,
      COUNT(DISTINCT v.id)::int as "visitCount",
      COALESCE(SUM(DISTINCT i.paid_amount), 0)::numeric as "totalSpend",
      MAX(v.created_at) as "lastVisit"
    FROM customers c
    LEFT JOIN visits v ON v.customer_id = c.id
    LEFT JOIN invoices i ON i.customer_id = c.id AND i.status = 'PAID'
    WHERE c.status = 'ACTIVE'
    GROUP BY c.id, c.name, c.phone
    ORDER BY "visitCount" DESC
  `;

  return {
    customers: customerStats.map((c) => ({
      ...c,
      totalSpend: Number(c.totalSpend),
      lastVisit: c.lastVisit ? new Date(c.lastVisit) : null,
    })),
    totalCustomers: customerStats.length,
  };
}

export async function getPaymentReport() {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const [unpaidInvoices, allPayments] = await Promise.all([
    client.invoice.findMany({
      where: { status: { in: ["UNPAID", "PARTIAL"] } },
      include: { customer: { select: { name: true } } },
      orderBy: { invoiceDate: "asc" },
    }),
    client.payment.findMany({
      where: { status: "PAID" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byMethod = allPayments.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  return { unpaidInvoices, totalUnpaid: unpaidInvoices.length, totalPaid: allPayments.length, byMethod };
}
