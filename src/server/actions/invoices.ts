"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import { sendEmail, generateInvoiceEmail } from "../lib/email";

export async function getInvoice(invoiceId: string): Promise<ActionResult<any>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const invoice = await prisma.invoice.findUnique({
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
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return prisma.payment.findMany({
    where: { payableId: invoiceId, payableType: "Invoice" },
    include: { receiver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function deletePayment(_paymentId: string): Promise<ActionResult> {
  return { success: false, error: { message: "Pembayaran tidak bisa dihapus", code: "BUSINESS_RULE" } };
}

export async function downloadInvoicePdf(invoiceId: string): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const invoice = await prisma.invoice.findUnique({
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

export async function emailInvoice(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const invoiceId = formData.get("invoiceId") as string;
  if (!invoiceId) {
    return { success: false, error: { message: "Invoice ID harus diisi", code: "VALIDATION" } };
  }

  const invoice = await prisma.invoice.findUnique({
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
