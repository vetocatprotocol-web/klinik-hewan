"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

export async function submitDailyReconciliation(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const dateStr = formData.get("date") as string;
  const actualCash = Number(formData.get("actualCash"));
  const actualCard = Number(formData.get("actualCard"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!dateStr) {
    return { success: false, error: { message: "Tanggal harus diisi", code: "VALIDATION" } };
  }

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const existing = await client.dailyReconciliation.findFirst({
    where: { date, kasirId: session.user.id! },
  });

  if (existing) {
    return { success: false, error: { message: "Rekonsiliasi untuk tanggal ini sudah ada", code: "BUSINESS_RULE" } };
  }

  const posOrders = await client.posOrder.findMany({
    where: {
      createdAt: { gte: date, lt: nextDate },
      status: "COMPLETED",
    },
  });

  const invoices = await client.invoice.findMany({
    where: {
      invoiceDate: { gte: date, lt: nextDate },
      status: { in: ["PAID", "PARTIAL"] },
    },
  });

  const payments = await client.payment.findMany({
    where: {
      createdAt: { gte: date, lt: nextDate },
      status: "PAID",
    },
  });

  const totalPOS = posOrders.reduce<number>((sum: number, o: any) => sum + Number(o.total), 0);
  const totalInvoice = invoices.reduce<number>((sum: number, i: any) => sum + Number(i.total), 0);
  const totalPayments = payments.reduce<number>((sum: number, p: any) => sum + Number(p.amount), 0);

  const cashPayments = payments.filter((p: any) => p.paymentMethod === "CASH");
  const cardPayments = payments.filter((p: any) => p.paymentMethod === "CARD");

  const expectedCash = cashPayments.reduce<number>((sum: number, p: any) => sum + Number(p.amount), 0);
  const expectedCard = cardPayments.reduce<number>((sum: number, p: any) => sum + Number(p.amount), 0);

  const cashDifference = actualCash - expectedCash;
  const cardDifference = actualCard - expectedCard;

  const reconciliation = await client.dailyReconciliation.create({
    data: {
      date,
      kasirId: session.user.id!,
      totalPOS,
      totalInvoice,
      totalPayments,
      expectedCash,
      actualCash,
      cashDifference,
      expectedCard,
      actualCard,
      cardDifference,
      notes,
      status: "PENDING",
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "DailyReconciliation",
    entityId: reconciliation.id,
    changes: {
      date: { old: null, new: dateStr },
      expectedCash: { old: null, new: expectedCash },
      actualCash: { old: null, new: actualCash },
      cashDifference: { old: null, new: cashDifference },
    },
  });

  return { success: true, data: reconciliation.id };
}

export async function approveReconciliation(
  reconciliationId: string,
  notes?: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menyetujui rekonsiliasi", code: "FORBIDDEN" } };
  }

  const reconciliation = await client.dailyReconciliation.findUnique({
    where: { id: reconciliationId },
  });

  if (!reconciliation) {
    return { success: false, error: { message: "Rekonsiliasi tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (reconciliation.status !== "PENDING") {
    return { success: false, error: { message: "Hanya rekonsiliasi PENDING yang bisa disetujui", code: "BUSINESS_RULE" } };
  }

  await client.dailyReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: "APPROVED",
      reviewedBy: session.user.id!,
      reviewedAt: new Date(),
      notes: notes || reconciliation.notes,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "DailyReconciliation",
    entityId: reconciliationId,
    changes: {
      status: { old: "PENDING", new: "APPROVED" },
    },
  });

  return { success: true, data: undefined };
}

export async function requestReconciliationRevision(
  reconciliationId: string,
  notes: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa meminta revisi rekonsiliasi", code: "FORBIDDEN" } };
  }

  const reconciliation = await client.dailyReconciliation.findUnique({
    where: { id: reconciliationId },
  });

  if (!reconciliation) {
    return { success: false, error: { message: "Rekonsiliasi tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (reconciliation.status !== "PENDING") {
    return { success: false, error: { message: "Hanya rekonsiliasi PENDING yang bisa ditolak", code: "BUSINESS_RULE" } };
  }

  await client.dailyReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: "REJECTED",
      reviewedBy: session.user.id!,
      reviewedAt: new Date(),
      notes,
    },
  });

  const kasir = await client.user.findUnique({
    where: { id: reconciliation.kasirId },
    select: { id: true },
  });

  if (kasir) {
    const { createNotification } = await import("../lib/notifications");
    await createNotification({
      userId: kasir.id,
      title: "Rekonsiliasi Perlu Revisi",
      message: `Rekonsiliasi tanggal ${reconciliation.date.toLocaleDateString("id-ID")} perlu diperbaiki. Catatan: ${notes}`,
      type: "warning",
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "DailyReconciliation",
    entityId: reconciliationId,
    changes: {
      status: { old: "PENDING", new: "REJECTED" },
      notes: { old: reconciliation.notes, new: notes },
    },
  });

  return { success: true, data: undefined };
}

export async function getDailyReconciliation(
  date: string
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const reconciliation = await client.dailyReconciliation.findFirst({
    where: { date: targetDate },
    include: {
      kasir: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });

  if (!reconciliation) {
    return { success: false, error: { message: "Rekonsiliasi tidak ditemukan", code: "NOT_FOUND" } };
  }

  return { success: true, data: reconciliation };
}

export async function getPendingReconciliations(): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengakses rekonsiliasi pending", code: "FORBIDDEN" } };
  }

  const reconciliations = await client.dailyReconciliation.findMany({
    where: { status: "PENDING" },
    include: {
      kasir: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return { success: true, data: reconciliations };
}

export async function getReconciliationHistory(
  dateFrom?: string,
  dateTo?: string
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const where: any = {};
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const reconciliations = await client.dailyReconciliation.findMany({
    where,
    include: {
      kasir: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return { success: true, data: reconciliations };
}

export async function getReconciliationReport(
  dateFrom?: string,
  dateTo?: string
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengakses laporan rekonsiliasi", code: "FORBIDDEN" } };
  }

  const where: any = {};
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const [reconciliations, approvedCount, rejectedCount] = await Promise.all([
    client.dailyReconciliation.findMany({ where }),
    client.dailyReconciliation.count({ where: { ...where, status: "APPROVED" } }),
    client.dailyReconciliation.count({ where: { ...where, status: "REJECTED" } }),
  ]);

  const totalReconciliations = reconciliations.length;
  const avgCashVariance =
    reconciliations.length > 0
      ? reconciliations.reduce((sum: number, r: any) => sum + Number(r.cashDifference), 0) / reconciliations.length
      : 0;
  const avgCardVariance =
    reconciliations.length > 0
      ? reconciliations.reduce((sum: number, r: any) => sum + Number(r.cardDifference), 0) / reconciliations.length
      : 0;

  return {
    success: true,
    data: {
      totalReconciliations,
      approvedCount,
      rejectedCount,
      pendingCount: totalReconciliations - approvedCount - rejectedCount,
      avgCashVariance,
      avgCardVariance,
    },
  };
}
