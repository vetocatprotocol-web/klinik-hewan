"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { paymentSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { generatePaymentNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";
import { sendEmail, generatePaymentConfirmationEmail } from "../lib/email";
import { Prisma } from "@prisma/client";

export async function processPayment(
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

  const invoice = await client.invoice.findUnique({
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

  await client.$transaction(async (tx) => {
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
      data: { paidAmount: newPaidAmount, status: newStatus as "PAID" | "PARTIAL" },
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
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const where: Prisma.PaymentWhereInput = {
    ...(search ? {
      OR: [
        { paymentNumber: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const PAGE_SIZE = 20;
  const [data, total] = await Promise.all([
    client.payment.findMany({
      where,
      include: { receiver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.payment.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function voidPayment(
  paymentId: string,
  reason: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const payment = await client.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    return { success: false, error: { message: "Pembayaran tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (payment.status !== "PAID") {
    return { success: false, error: { message: "Hanya pembayaran dengan status PAID yang bisa di-void", code: "BUSINESS_RULE" } };
  }

  const paymentAge = Date.now() - new Date(payment.createdAt).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (paymentAge > twentyFourHours) {
    return { success: false, error: { message: "Pembayaran hanya bisa di-void dalam 24 jam", code: "BUSINESS_RULE" } };
  }

  const previousStatus = payment.status;

  await client.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED", notes: reason },
    });

    if (payment.payableType === "Invoice") {
      const invoice = await tx.invoice.findUnique({ where: { id: payment.payableId } });
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) - Number(payment.amount);
        const newStatus = newPaidAmount <= 0 ? "UNPAID" : "PARTIAL";

        await tx.invoice.update({
          where: { id: payment.payableId },
          data: {
            paidAmount: Math.max(0, newPaidAmount),
            status: newStatus as "UNPAID" | "PARTIAL",
          },
        });

        if (invoice.sourceType === "VISIT") {
          await tx.visit.update({ where: { id: invoice.sourceId }, data: { status: "COMPLETED" } });
        } else if (invoice.sourceType === "BILLING") {
          await tx.billing.update({ where: { id: invoice.sourceId }, data: { status: "OPEN" } });
        }
      }
    }
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Payment",
    entityId: paymentId,
    changes: {
      status: { old: previousStatus, new: "FAILED" },
      voidReason: { old: null, new: reason },
      amount: { old: Number(payment.amount), new: 0 },
    },
  });

  return { success: true, data: undefined };
}

export async function printReceipt(
  paymentId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const payment = await client.payment.findUnique({
    where: { id: paymentId },
    include: { receiver: { select: { name: true } } },
  });

  if (!payment) {
    return { success: false, error: { message: "Pembayaran tidak ditemukan", code: "NOT_FOUND" } };
  }

  let invoice = null;
  if (payment.payableType === "Invoice") {
    invoice = await client.invoice.findUnique({
      where: { id: payment.payableId },
      include: {
        customer: { select: { name: true, phone: true, address: true } },
        invoiceItems: true,
      },
    });
  }

  const receiptData = {
    paymentNumber: payment.paymentNumber,
    paymentDate: payment.createdAt,
    paymentMethod: payment.paymentMethod,
    amount: Number(payment.amount),
    status: payment.status,
    cashier: payment.receiver.name,
    invoice: invoice
      ? {
          invoiceNumber: invoice.invoiceNumber,
          customer: invoice.customer,
          items: invoice.invoiceItems.map((item) => ({
            name: item.itemName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
          })),
          subtotal: Number(invoice.subtotal),
          taxAmount: Number(invoice.taxAmount),
          total: Number(invoice.total),
        }
      : null,
  };

  return { success: true, data: receiptData };
}

export async function deletePayment(_paymentId: string): Promise<ActionResult> {
  return { success: false, error: { message: "Pembayaran tidak bisa dihapus", code: "BUSINESS_RULE" } };
}
