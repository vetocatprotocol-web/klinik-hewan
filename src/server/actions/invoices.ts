"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { paymentSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { generatePaymentNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";

export async function processPayment(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
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
    include: { customer: { select: { name: true, email: true } } },
  });

  if (!invoice) {
    return { success: false, error: { message: "Invoice tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (invoice.status === "PAID") {
    return { success: false, error: { message: "Invoice sudah dibayar", code: "BUSINESS_RULE" } };
  }

  const remaining = Number(invoice.total) - Number(invoice.paidAmount);
  if (data.amount > remaining) {
    return { success: false, error: { message: "Jumlah pembayaran melebihi sisa tagihan", code: "INVALID_PAYMENT" } };
  }

  const now = new Date();
  const paymentNumber = generatePaymentNumber(now);
  const newPaidAmount = Number(invoice.paidAmount) + data.amount;
  const newStatus = newPaidAmount >= Number(invoice.total) ? "PAID" : "PARTIAL";

  await prisma.payment.create({
    data: {
      paymentNumber,
      payableType: "Invoice",
      payableId: data.invoiceId,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      status: "PAID",
      receivedBy: session.user.id!,
    },
  });

  await prisma.invoice.update({
    where: { id: data.invoiceId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus as any,
    },
  });

  // If invoice is fully paid, update related visit/billing status
  if (newStatus === "PAID") {
    if (invoice.sourceType === "VISIT") {
      await prisma.visit.update({
        where: { id: invoice.sourceId },
        data: { status: "PAID" },
      });
    } else if (invoice.sourceType === "BILLING") {
      await prisma.billing.update({
        where: { id: invoice.sourceId },
        data: { status: "PAID" },
      });
    }
  }

  await createAuditLog({
    userId: session.user.id,
    action: "PAYMENT",
    entityType: "Payment",
    entityId: paymentNumber,
    changes: {
      amount: { old: null, new: data.amount },
      method: { old: null, new: data.paymentMethod },
    },
  });

  // Notify customer
  if (invoice.customer.email) {
    const owners = await prisma.user.findMany({
      where: { role: { name: "OWNER" }, status: "ACTIVE" },
    });
    for (const owner of owners) {
      await createNotification({
        userId: owner.id,
        title: "Pembayaran Diterima",
        message: `Pembayaran ${invoice.customer.name} sebesar Rp ${data.amount.toLocaleString("id-ID")} telah diterima`,
        type: "success",
      });
    }
  }

  return { success: true, data: paymentNumber };
}

export async function getInvoicePayments(invoiceId: string) {
  return prisma.payment.findMany({
    where: { payableId: invoiceId, payableType: "Invoice" },
    include: { receiver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
