"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";

const REPORT_ROLES = ["OWNER", "ADMIN"];

export async function getDailyReport(date?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [visits, payments, lowStockProducts] = await Promise.all([
    prisma.visit.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      include: {
        visitItems: true,
        customer: { select: { name: true } },
        pet: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay }, status: "PAID" },
    }),
    prisma.product.findMany({
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
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
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
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const lowStock = products.filter((p) => p.status === "ACTIVE" && p.currentStock < p.reorderPoint);
  const outOfStock = products.filter((p) => p.status === "ACTIVE" && p.currentStock === 0);

  return { products, lowStock, outOfStock, totalProducts: products.length };
}

export async function getCustomerReport() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const customers = await prisma.customer.findMany({
    where: { status: "ACTIVE" },
    include: {
      visits: { select: { id: true, createdAt: true } },
      invoices: { select: { id: true, total: true, paidAmount: true } },
    },
  });

  const customerStats = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    visitCount: c.visits.length,
    totalSpend: c.invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0),
    lastVisit: c.visits.length > 0 ? c.visits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt : null,
  }));

  return { customers: customerStats, totalCustomers: customers.length };
}

export async function getPaymentReport() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const unpaidInvoices = await prisma.invoice.findMany({
    where: { status: { in: ["UNPAID", "PARTIAL"] } },
    include: { customer: { select: { name: true } } },
    orderBy: { invoiceDate: "asc" },
  });

  const allPayments = await prisma.payment.findMany({
    where: { status: "PAID" },
    orderBy: { createdAt: "desc" },
  });

  const byMethod = allPayments.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  return { unpaidInvoices, totalUnpaid: unpaidInvoices.length, totalPaid: allPayments.length, byMethod };
}
