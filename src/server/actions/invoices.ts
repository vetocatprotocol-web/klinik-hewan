"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import { sendEmail, generateInvoiceEmail } from "../lib/email";
import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getInvoice(invoiceId: string): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const invoice = await client.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
      pet: { select: { id: true, name: true, species: true, breed: true } },
      invoiceItems: true,
    },
  });

  if (!invoice) {
    return { success: false, error: { message: "Invoice tidak ditemukan", code: "NOT_FOUND" } };
  }

  return { success: true, data: invoice };
}

export async function getInvoicePayments(invoiceId: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return client.payment.findMany({
    where: { payableId: invoiceId, payableType: "Invoice" },
    include: { receiver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function deletePayment(_paymentId: string): Promise<ActionResult> {
  return { success: false, error: { message: "Pembayaran tidak bisa dihapus", code: "BUSINESS_RULE" } };
}

export async function downloadInvoicePdf(invoiceId: string): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const invoice = await client.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: { select: { name: true, email: true, phone: true, address: true } },
      pet: { select: { name: true, species: true } },
      invoiceItems: true,
    },
  });

  if (!invoice) {
    return { success: false, error: { message: "Invoice tidak ditemukan", code: "NOT_FOUND" } };
  }

  try {
    const { generateInvoiceHtml } = await import("../lib/pdf");
    const html = await generateInvoiceHtml(invoiceId);
    return { success: true, data: html };
  } catch (error) {
    return { success: false, error: { message: "Gagal generate PDF invoice", code: "PDF_FAILED" } };
  }
}

export async function exportInvoices(
  filters: { status?: string; dateFrom?: string; dateTo?: string; customerId?: string },
  format: "csv" | "pdf"
): Promise<ActionResult<Array<Record<string, unknown>>>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const where: Prisma.InvoiceWhereInput = {
    ...(filters.status && { status: filters.status as Prisma.EnumInvoiceStatusFilter["equals"] }),
    ...(filters.customerId && { customerId: filters.customerId }),
    ...(filters.dateFrom || filters.dateTo ? {
      invoiceDate: {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      }
    } : {}),
  };

  const invoices = await client.invoice.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      invoiceItems: true,
    },
    orderBy: { invoiceDate: "desc" },
  });

  const exportData = invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customer.name,
    customerPhone: invoice.customer.phone,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    discountAmount: Number(invoice.discountAmount),
    total: Number(invoice.total),
    paidAmount: Number(invoice.paidAmount),
    status: invoice.status,
    itemCount: invoice.invoiceItems.length,
    items: invoice.invoiceItems.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      category: item.category,
    })),
  }));

  return { success: true, data: exportData };
}

export async function emailInvoice(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const invoiceId = formData.get("invoiceId") as string;
  if (!invoiceId) {
    return { success: false, error: { message: "Invoice ID harus diisi", code: "VALIDATION" } };
  }

  const invoice = await client.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: { select: { name: true, email: true } } },
  });

  if (!invoice) {
    return { success: false, error: { message: "Invoice tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (!invoice.customer.email) {
    return { success: false, error: { message: "Pelanggan tidak memiliki alamat email", code: "NO_EMAIL" } };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

  const html = generateInvoiceEmail({
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    total: Number(invoice.total),
    invoiceUrl,
  });

  const result = await sendEmail({
    to: invoice.customer.email,
    subject: `Invoice ${invoice.invoiceNumber} - Klinik Hewan`,
    html,
  });

  if (!result.success) {
    return { success: false, error: { message: "Gagal mengirim email", code: "EMAIL_FAILED" } };
  }

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Invoice",
    entityId: invoiceId,
    changes: { emailSent: { old: false, new: true } },
  });

  return { success: true, data: invoice.invoiceNumber };
}
