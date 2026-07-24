"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { paymentSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { generatePaymentNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";
import { sendEmail, generatePaymentConfirmationEmail } from "../lib/email";

export async function processPayment(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
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
    include: { customer: { select: { id: true, name: true, email: true, userId: true } } },
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
  const userId = session.user.id!;

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        paymentNumber,
        payableType: "Invoice",
        payableId: data.invoiceId,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        status: "PAID",
        receivedBy: userId,
      },
    });

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: { paidAmount: newPaidAmount, status: newStatus as any },
    });

    if (newStatus === "PAID") {
      if (invoice.sourceType === "VISIT") {
        await tx.visit.update({ where: { id: invoice.sourceId }, data: { status: "PAID" } });
      } else if (invoice.sourceType === "BILLING") {
        await tx.billing.update({ where: { id: invoice.sourceId }, data: { status: "PAID" } });
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

  if (invoice.customer.userId) {
    await createNotification({
      userId: invoice.customer.userId,
      title: "Pembayaran Diterima",
      message: `Pembayaran Anda sebesar Rp ${data.amount.toLocaleString("id-ID")} untuk invoice ${invoice.invoiceNumber} telah diterima.`,
      type: "success",
    });
  }

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

export async function getPayments({ page = 1, search = "" }: { page?: number; search?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const where: any = {};
  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const PAGE_SIZE = 20;
  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { receiver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function deletePayment(_paymentId: string): Promise<ActionResult> {
  return { success: false, error: { message: "Pembayaran tidak bisa dihapus", code: "BUSINESS_RULE" } };
}
