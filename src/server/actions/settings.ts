"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { companyInfoSchema, taxConfigSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

export async function updateCompanyInfo(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    address: (formData.get("address") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    taxId: (formData.get("taxId") as string) || undefined,
    invoiceFooter: (formData.get("invoiceFooter") as string) || undefined,
    receiptFooter: (formData.get("receiptFooter") as string) || undefined,
  };

  const validated = companyInfoSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  await prisma.setting.upsert({
    where: { key: "company_info" },
    update: { value: data },
    create: { key: "company_info", value: data },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "company_info",
  });

  return { success: true, data: undefined };
}

export async function updateTaxConfig(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    type: formData.get("type") as string,
    value: Number(formData.get("value")),
    enabled: formData.get("enabled") === "true",
  };

  const validated = taxConfigSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  await prisma.setting.upsert({
    where: { key: "tax_config" },
    update: { value: data },
    create: { key: "tax_config", value: data },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "tax_config",
  });

  return { success: true, data: undefined };
}

export async function updatePaymentMethods(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const methodsJson = formData.get("methods") as string;
  if (!methodsJson) {
    return { success: false, error: { message: "Data metode pembayaran harus diisi" } };
  }

  const methods = JSON.parse(methodsJson);

  const hasActive = methods.some((m: any) => m.active);
  if (!hasActive) {
    return { success: false, error: { message: "Minimal 1 metode pembayaran harus aktif", code: "BUSINESS_RULE" } };
  }

  await prisma.setting.upsert({
    where: { key: "payment_methods" },
    update: { value: methods },
    create: { key: "payment_methods", value: methods },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "payment_methods",
  });

  return { success: true, data: undefined };
}

export async function updateNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true, data: undefined };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true, data: undefined };
}

export async function updateNumberingFormat(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    visitPrefix: formData.get("visitPrefix") as string || "VIS",
    invoicePrefix: formData.get("invoicePrefix") as string || "INV",
    billingPrefix: formData.get("billingPrefix") as string || "BIL",
    receiptPrefix: formData.get("receiptPrefix") as string || "RCP",
    paymentPrefix: formData.get("paymentPrefix") as string || "PAY",
    prescriptionPrefix: formData.get("prescriptionPrefix") as string || "RX",
  };

  await prisma.setting.upsert({
    where: { key: "numbering_format" },
    update: { value: data },
    create: { key: "numbering_format", value: data },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "numbering_format",
  });

  return { success: true, data: undefined };
}
