"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

const REPORT_ROLES = ["OWNER", "KASIR", "DOKTER"];

export async function getDailyReport(date?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
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

  const role = (session.user as { id: string; role: string }).role;
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

  const role = (session.user as { id: string; role: string }).role;
  if (!REPORT_ROLES.includes(role)) throw new Error("FORBIDDEN");

  const customerStats: Array<{ id: string; name: string; phone: string; visitCount: number; totalSpend: number | string; lastVisit: Date | string | null }> = await client.$queryRaw`
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

  const role = (session.user as { id: string; role: string }).role;
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

export async function getReceivablesAgingReport() {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) throw new Error("FORBIDDEN");

  const unpaidInvoices = await client.invoice.findMany({
    where: { status: { in: ["UNPAID", "PARTIAL"] } },
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { invoiceDate: "asc" },
  });

  const now = new Date();

  const buckets = {
    "0-30": { count: 0, total: 0, invoices: [] as Array<Record<string, unknown>> },
    "31-60": { count: 0, total: 0, invoices: [] as Array<Record<string, unknown>> },
    "61-90": { count: 0, total: 0, invoices: [] as Array<Record<string, unknown>> },
    ">90": { count: 0, total: 0, invoices: [] as Array<Record<string, unknown>> },
  };

  for (const invoice of unpaidInvoices) {
    const invoiceDate = new Date(invoice.invoiceDate);
    const diffDays = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    const outstanding = Number(invoice.total) - Number(invoice.paidAmount);

    let bucket: keyof typeof buckets;
    if (diffDays <= 30) bucket = "0-30";
    else if (diffDays <= 60) bucket = "31-60";
    else if (diffDays <= 90) bucket = "61-90";
    else bucket = ">90";

    buckets[bucket].count += 1;
    buckets[bucket].total += outstanding;
    buckets[bucket].invoices.push({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      invoiceDate: invoice.invoiceDate,
      total: Number(invoice.total),
      paidAmount: Number(invoice.paidAmount),
      outstanding,
      daysOverdue: diffDays,
    });
  }

  return {
    buckets,
    totalUnpaid: unpaidInvoices.length,
    totalOutstanding: unpaidInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)),
      0
    ),
  };
}

export async function getCollectionRateReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) throw new Error("FORBIDDEN");

  const where: Prisma.InvoiceWhereInput = {
    ...(dateFrom || dateTo ? {
      invoiceDate: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    } : {}),
  };

  const invoices = await client.invoice.findMany({ where });
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const totalPaidAmount = paidInvoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);
  const totalInvoiceAmount = invoices.reduce((sum, i) => sum + Number(i.total), 0);

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalInvoices,
    paidCount: paidInvoices.length,
    unpaidCount: totalInvoices - paidInvoices.length,
    collectionRate: totalInvoices > 0 ? (paidInvoices.length / totalInvoices) * 100 : 0,
    totalInvoiceAmount,
    totalPaidAmount,
    collectionRateByAmount: totalInvoiceAmount > 0 ? (totalPaidAmount / totalInvoiceAmount) * 100 : 0,
  };
}

export async function getVisitStatisticsReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "DOKTER"].includes(role)) throw new Error("FORBIDDEN");

  const where = {
    ...(dateFrom || dateTo ? { visitDate: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const visits = await client.visit.findMany({
    where,
    include: {
      doctor: { select: { id: true, name: true } },
      pet: { select: { id: true, species: true } },
      visitItems: {
        include: { service: { select: { category: true } } },
      },
    },
  });

  const byDoctor: Record<string, { name: string; count: number }> = {};
  const byServiceCategory: Record<string, number> = {};
  const bySpecies: Record<string, number> = {};

  for (const visit of visits) {
    if (visit.doctor) {
      const key = visit.doctor.id;
      if (!byDoctor[key]) byDoctor[key] = { name: visit.doctor.name, count: 0 };
      byDoctor[key].count += 1;
    }

    if (visit.pet?.species) {
      bySpecies[visit.pet.species] = (bySpecies[visit.pet.species] || 0) + 1;
    }

    for (const item of visit.visitItems) {
      if (item.service?.category) {
        byServiceCategory[item.service.category] = (byServiceCategory[item.service.category] || 0) + 1;
      }
    }
  }

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalVisits: visits.length,
    byDoctor: Object.entries(byDoctor)
      .map(([id, data]) => ({ doctorId: id, ...data }))
      .sort((a, b) => b.count - a.count),
    byServiceCategory: Object.entries(byServiceCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    bySpecies: Object.entries(bySpecies)
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getDiagnosisBreakdownReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "DOKTER"].includes(role)) throw new Error("FORBIDDEN");

  const where = {
    ...(dateFrom || dateTo ? { visitDate: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const visits = await client.visit.findMany({
    where,
    select: { diagnosis: true },
  });

  const diagnosisCount: Record<string, number> = {};
  for (const visit of visits) {
    const diag = visit.diagnosis || "Tidak diketahui";
    diagnosisCount[diag] = (diagnosisCount[diag] || 0) + 1;
  }

  const top10 = Object.entries(diagnosisCount)
    .map(([diagnosis, count]) => ({ diagnosis, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalVisits: visits.length,
    diagnoses: top10,
  };
}

export async function getHotelOccupancyReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) throw new Error("FORBIDDEN");

  const totalRooms = await client.hotelRoom.count({
    where: { status: { not: "MAINTENANCE" } },
  });

  const where = {
    ...(dateFrom || dateTo ? { checkInDate: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const bookings = await client.hotelBooking.findMany({
    where,
    select: {
      totalDays: true,
      total: true,
      checkInDate: true,
      checkOutDate: true,
      status: true,
    },
  });

  const rooms = await client.hotelRoom.findMany({
    where: { status: { not: "MAINTENANCE" } },
    select: { capacity: true, currentOccupancy: true },
  });

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupancy = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);

  const activeBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN"
  );

  const completedBookings = bookings.filter((b) => b.status === "CHECKED_OUT");
  const avgLengthOfStay =
    completedBookings.length > 0
      ? completedBookings.reduce((sum, b) => sum + b.totalDays, 0) / completedBookings.length
      : 0;

  const totalRevenue = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + Number(b.total), 0);

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalRooms,
    occupancyRate: totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0,
    totalCapacity,
    totalOccupancy,
    totalBookings: bookings.length,
    activeBookings: activeBookings.length,
    completedBookings: completedBookings.length,
    totalRevenue,
    avgLengthOfStay: Math.round(avgLengthOfStay * 10) / 10,
  };
}

export async function getDiscountReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") throw new Error("FORBIDDEN");

  const where = {
    ...(dateFrom || dateTo ? { appliedAt: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const discounts = await client.discountLog.findMany({
    where,
    include: {
      invoice: { select: { id: true, invoiceNumber: true, customerId: true, customer: { select: { id: true, name: true } } } },
      applier: { select: { id: true, name: true } },
    },
    orderBy: { appliedAt: "desc" },
  });

  const totalDiscountAmount = discounts.reduce((sum, d) => sum + Number(d.discountAmount), 0);

  const byCashier: Record<string, { name: string; count: number; totalAmount: number }> = {};
  for (const d of discounts) {
    const key = d.appliedBy;
    if (!byCashier[key]) byCashier[key] = { name: d.applier.name, count: 0, totalAmount: 0 };
    byCashier[key].count += 1;
    byCashier[key].totalAmount += Number(d.discountAmount);
  }

  const byCustomer: Record<string, { name: string; count: number; totalAmount: number }> = {};
  for (const d of discounts) {
    const key = d.invoice.customerId;
    if (!byCustomer[key]) byCustomer[key] = { name: d.invoice.customer?.name || "-", count: 0, totalAmount: 0 };
    byCustomer[key].count += 1;
    byCustomer[key].totalAmount += Number(d.discountAmount);
  }

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalDiscounts: discounts.length,
    totalDiscountAmount,
    byCashier: Object.entries(byCashier).map(([id, data]) => ({ cashierId: id, ...data })),
    byCustomer: Object.entries(byCustomer).map(([id, data]) => ({ customerId: id, ...data })),
  };
}

export async function getStockAdjustmentReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") throw new Error("FORBIDDEN");

  const where = {
    ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const adjustments = await client.stockAdjustment.findMany({
    where,
    include: {
      product: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byReason: Record<string, { count: number; totalQuantity: number }> = {};
  for (const adj of adjustments) {
    if (!byReason[adj.reason]) byReason[adj.reason] = { count: 0, totalQuantity: 0 };
    byReason[adj.reason].count += 1;
    byReason[adj.reason].totalQuantity += adj.quantity;
  }

  const byProduct: Record<string, { name: string; count: number; totalQuantity: number }> = {};
  for (const adj of adjustments) {
    const key = adj.productId;
    if (!byProduct[key]) byProduct[key] = { name: adj.product.name, count: 0, totalQuantity: 0 };
    byProduct[key].count += 1;
    byProduct[key].totalQuantity += adj.quantity;
  }

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalAdjustments: adjustments.length,
    byReason: Object.entries(byReason).map(([reason, data]) => ({ reason, ...data })),
    byProduct: Object.entries(byProduct)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getInventoryTurnoverReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) throw new Error("FORBIDDEN");

  const where = {
    ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const products = await client.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      stockAdjustments: {
        where: { reason: "POS_SOLD", ...where },
        orderBy: { createdAt: "asc" },
      },
      posOrderItems: {
        where: { posOrder: { status: "COMPLETED", ...where } },
      },
    },
  });

  const turnoverData = products
    .filter((p) => p.posOrderItems.length > 0)
    .map((product) => {
      const totalSold = product.posOrderItems.reduce((sum, item) => sum + item.quantity, 0);

      let avgDaysInStock = 0;
      if (product.stockAdjustments.length > 0) {
        const firstAdjustment = product.stockAdjustments[0];
        const lastAdjustment = product.stockAdjustments[product.stockAdjustments.length - 1];
        const daysDiff = (new Date(lastAdjustment.createdAt).getTime() - new Date(firstAdjustment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        avgDaysInStock = product.stockAdjustments.length > 1
          ? Math.round(daysDiff / (product.stockAdjustments.length - 1) * 10) / 10
          : 0;
      }

      const turnoverRate = avgDaysInStock > 0 ? Math.round((totalSold / avgDaysInStock) * 100) / 100 : 0;

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.currentStock,
        totalSold,
        avgDaysInStock,
        turnoverRate,
      };
    })
    .sort((a, b) => b.turnoverRate - a.turnoverRate);

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalProducts: turnoverData.length,
    products: turnoverData,
  };
}

export async function getSupplierPerformanceReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) throw new Error("FORBIDDEN");

  const poWhere = {
    ...(dateFrom || dateTo ? { orderDate: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const suppliers = await client.supplier.findMany({
    where: { status: "ACTIVE" },
    include: {
      purchaseOrders: {
        where: poWhere,
        include: {
          items: true,
          receipts: true,
        },
      },
    },
  });

  const performanceData = suppliers.map((supplier) => {
    const totalPOs = supplier.purchaseOrders.length;
    const totalSpend = supplier.purchaseOrders.reduce(
      (sum, po) => sum + Number(po.totalAmount),
      0
    );

    const onTimePOs = supplier.purchaseOrders.filter((po) => {
      if (!po.requiredDate) return true;
      const lastReceipt = po.receipts.sort(
        (a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
      )[0];
      if (!lastReceipt) return po.status === "CANCELLED";
      return new Date(lastReceipt.receivedDate) <= new Date(po.requiredDate);
    }).length;

    const onTimeRate = totalPOs > 0 ? Math.round((onTimePOs / totalPOs) * 10000) / 100 : 0;

    const totalItems = supplier.purchaseOrders.reduce((sum, po) => sum + po.items.length, 0);
    const fullyReceivedItems = supplier.purchaseOrders.reduce(
      (sum, po) => sum + po.items.filter((item) => item.receivedQuantity >= item.quantity).length,
      0
    );
    const qualityScore = totalItems > 0 ? Math.round((fullyReceivedItems / totalItems) * 10000) / 100 : 0;

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalPOs,
      totalSpend,
      onTimeRate,
      qualityScore,
    };
  });

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalSuppliers: performanceData.length,
    suppliers: performanceData.sort((a, b) => b.totalSpend - a.totalSpend),
  };
}

export async function getVaccinationReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "DOKTER"].includes(role)) throw new Error("FORBIDDEN");

  const where = {
    ...(dateFrom || dateTo ? { visitDate: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const vaccinationServices = await client.service.findMany({
    where: { category: "VAKSINASI", status: "ACTIVE" },
    select: { id: true, name: true },
  });

  const serviceIds = vaccinationServices.map((s) => s.id);

  const visitItems = await client.visitItem.findMany({
    where: {
      itemType: "SERVICE",
      serviceId: { in: serviceIds },
      visit: where,
    },
    include: {
      visit: {
        select: {
          pet: { select: { species: true, breed: true } },
        },
      },
      service: { select: { name: true } },
    },
  });

  const byType: Record<string, { count: number; totalRevenue: number }> = {};
  const bySpecies: Record<string, number> = {};

  for (const item of visitItems) {
    const serviceName = item.service?.name || "Unknown";
    if (!byType[serviceName]) byType[serviceName] = { count: 0, totalRevenue: 0 };
    byType[serviceName].count += 1;
    byType[serviceName].totalRevenue += Number(item.subtotal);

    const species = item.visit?.pet?.species || "Unknown";
    bySpecies[species] = (bySpecies[species] || 0) + 1;
  }

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalVaccinations: visitItems.length,
    byType: Object.entries(byType).map(([type, data]) => ({ type, ...data })),
    bySpecies: Object.entries(bySpecies)
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getPriceChangeReport(dateFrom?: string, dateTo?: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "OWNER") throw new Error("FORBIDDEN");

  const where = {
    ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } } : {}),
  };

  const [serviceChanges, drugChanges, productChanges] = await Promise.all([
    client.serviceChangeRequest.findMany({
      where,
      include: { service: { select: { name: true } } },
    }),
    client.drugChangeRequest.findMany({
      where,
      include: { drug: { select: { name: true } } },
    }),
    client.productChangeRequest.findMany({
      where,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const allChanges = [
    ...serviceChanges.map((c) => ({ ...c, entityType: "SERVICE" as const, entityName: c.service.name })),
    ...drugChanges.map((c) => ({ ...c, entityType: "DRUG" as const, entityName: c.drug.name })),
    ...productChanges.map((c) => ({ ...c, entityType: "PRODUCT" as const, entityName: c.product.name })),
  ];

  const totalChanges = allChanges.length;
  const approved = allChanges.filter((c) => c.status === "APPROVED").length;
  const rejected = allChanges.filter((c) => c.status === "REJECTED").length;
  const pending = allChanges.filter((c) => c.status === "PENDING").length;

  const byEntityType = {
    SERVICE: {
      total: serviceChanges.length,
      approved: serviceChanges.filter((c) => c.status === "APPROVED").length,
      rejected: serviceChanges.filter((c) => c.status === "REJECTED").length,
      pending: serviceChanges.filter((c) => c.status === "PENDING").length,
    },
    DRUG: {
      total: drugChanges.length,
      approved: drugChanges.filter((c) => c.status === "APPROVED").length,
      rejected: drugChanges.filter((c) => c.status === "REJECTED").length,
      pending: drugChanges.filter((c) => c.status === "PENDING").length,
    },
    PRODUCT: {
      total: productChanges.length,
      approved: productChanges.filter((c) => c.status === "APPROVED").length,
      rejected: productChanges.filter((c) => c.status === "REJECTED").length,
      pending: productChanges.filter((c) => c.status === "PENDING").length,
    },
  };

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalChanges,
    approved,
    rejected,
    pending,
    byEntityType,
  };
}
