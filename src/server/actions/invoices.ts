"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { paymentSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { generatePaymentNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";
import { sendEmail, generateInvoiceEmail, generatePaymentConfirmationEmail } from "../lib/email";

const PAYMENT_ROLES = ["OWNER", "KASIR"];

export async function processPayment(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!PAYMENT_ROLES.includes(role)) {
    return { success: false, error: { message: "Hanya Owner atau Kasir yang bisa memproses pembayaran", code: "FORBIDDEN" } };
  }

  const data = {
    invoiceId: formData.get("invoiceId") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    amount: Number(formData.get("amount")),
  };

  const validated = paymentSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: {
      customer: { select: { id: true, name: true, email: true, userId: true } },
    },
  });

  if (!invoice) {
    return { success: false, error: { message: "Invoice tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (invoice.status === "PAID") {
    return { success: false, error: { message: "Invoice sudah dibayar penuh", code: "BUSINESS_RULE" } };
  }

  const remaining = Number(invoice.total) - Number(invoice.paidAmount);
  if (data.amount > remaining) {
    return { success: false, error: { message: `Jumlah pembayaran melebihi sisa tagihan. Sisa: Rp ${remaining.toLocaleString("id-ID")}`, code: "INVALID_PAYMENT" } };
  }

  const now = new Date();
  const paymentNumber = generatePaymentNumber(now);
  const newPaidAmount = Number(invoice.paidAmount) + data.amount;
  const newStatus = newPaidAmount >= Number(invoice.total) ? "PAID" : "PARTIAL";
  const receivedById = session.user.id!;

  // Payment + invoice update + status cascade in transaction
  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        paymentNumber,
        payableType: "Invoice",
        payableId: data.invoiceId,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        status: "PAID",
        receivedBy: receivedById,
      },
    });

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus as any,
      },
    });

    // If invoice is fully paid, update related visit/billing status
    if (newStatus === "PAID") {
      if (invoice.sourceType === "VISIT") {
        await tx.visit.update({
          where: { id: invoice.sourceId },
          data: { status: "PAID" },
        });
      } else if (invoice.sourceType === "BILLING") {
        await tx.billing.update({
          where: { id: invoice.sourceId },
          data: { status: "PAID" },
        });
      }
    }
  });

  await createAuditLog({
    userId: session.user.id,
    action: "PAYMENT",
    entityType: "Payment",
    entityId: paymentNumber,
    changes: {
      invoiceNumber: { old: null, new: invoice.invoiceNumber },
      amount: { old: null, new: data.amount },
      paymentMethod: { old: null, new: data.paymentMethod },
      newStatus: { old: invoice.status, new: newStatus },
    },
  });

  // Notify customer via in-app notification
  if (invoice.customer.userId) {
    await createNotification({
      userId: invoice.customer.userId,
      title: "Pembayaran Diterima",
      message: `Pembayaran Anda sebesar Rp ${data.amount.toLocaleString("id-ID")} untuk invoice ${invoice.invoiceNumber} telah diterima. ${newStatus === "PAID" ? "Invoice telah lunas." : `Sisa: Rp ${(remaining - data.amount).toLocaleString("id-ID")}`}`,
      type: "success",
    });
  }

  // Send payment confirmation email
  if (invoice.customer.email) {
    try {
      await sendEmail({
        to: invoice.customer.email,
        subject: `Konfirmasi Pembayaran - ${invoice.invoiceNumber}`,
        html: generatePaymentConfirmationEmail({
          customerName: invoice.customer.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        }),
      });
    } catch (error) {
      console.error("Failed to send payment confirmation email:", error);
    }
  }

  return { success: true, data: paymentNumber };
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

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  // PRD: Payments cannot be deleted
  return { success: false, error: { message: "Pembayaran tidak bisa dihapus", code: "BUSINESS_RULE" } };
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
  if (!PAYMENT_ROLES.includes(role)) {
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
