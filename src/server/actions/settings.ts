"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { companyInfoSchema, taxConfigSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

export async function updateCompanyInfo(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
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

  await client.setting.upsert({
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
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
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

  await client.setting.upsert({
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
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const methodsJson = formData.get("methods") as string;
  if (!methodsJson) {
    return { success: false, error: { message: "Data metode pembayaran harus diisi" } };
  }

  const methods = JSON.parse(methodsJson);

  const hasActive = methods.some((m: { active: boolean }) => m.active);
  if (!hasActive) {
    return { success: false, error: { message: "Minimal 1 metode pembayaran harus aktif", code: "BUSINESS_RULE" } };
  }

  await client.setting.upsert({
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

export async function updateNumberingFormat(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
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

  await client.setting.upsert({
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

export async function updateHotelRates(
  rates: Array<{ roomType: string; dailyRate: number }>
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  if (!rates || rates.length === 0) {
    return { success: false, error: { message: "Data tarif kamar harus diisi" } };
  }

  await client.setting.upsert({
    where: { key: "hotel_rates" },
    update: { value: rates },
    create: { key: "hotel_rates", value: rates },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "hotel_rates",
    changes: { rates: { old: null, new: rates } },
  });

  return { success: true, data: undefined };
}

export async function updateFraudPreventionPolicies(policies: {
  discountThreshold: number;
  stockAdjustmentThreshold: number;
  poApprovalThreshold: number;
  reconciliationTolerance: number;
}): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  await client.setting.upsert({
    where: { key: "fraud_prevention_policies" },
    update: { value: policies },
    create: { key: "fraud_prevention_policies", value: policies },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "fraud_prevention_policies",
    changes: { policies: { old: null, new: policies } },
  });

  return { success: true, data: undefined };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSettingChangeHistory(key: string): Promise<ActionResult<any[]>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const logs = await client.auditLog.findMany({
    where: {
      entityType: "Setting",
      entityId: key,
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return { success: true, data: logs };
}

export async function revertSetting(key: string, version: number): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as { id: string; role: string }).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const userId = (session.user as { id: string }).id;

  const logs = await client.auditLog.findMany({
    where: {
      entityType: "Setting",
      entityId: key,
      action: "UPDATE",
    },
    orderBy: { createdAt: "desc" },
  });

  if (logs.length === 0) {
    return { success: false, error: { message: "Tidak ada riwayat perubahan untuk setting ini", code: "NOT_FOUND" } };
  }

  if (version < 0 || version >= logs.length) {
    return { success: false, error: { message: "Versi tidak valid", code: "VALIDATION" } };
  }

  const targetLog = logs[version];

  if (!targetLog.changes || typeof targetLog.changes !== "object") {
    return { success: false, error: { message: "Data perubahan tidak tersedia untuk versi ini", code: "NOT_FOUND" } };
  }

  const changes = targetLog.changes as { value?: { old?: unknown; new?: unknown } };
  const oldValue = changes.value?.old;

  if (oldValue === undefined || oldValue === null) {
    return { success: false, error: { message: "Nilai sebelumnya tidak tersedia untuk versi ini", code: "NOT_FOUND" } };
  }

  const currentSetting = await client.setting.findUnique({ where: { key } });

  await client.setting.update({
    where: { key },
    data: { value: oldValue },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entityType: "Setting",
    entityId: key,
    changes: {
      value: {
        old: currentSetting?.value,
        new: oldValue,
      },
      revertedFromVersion: { old: null, new: version },
    },
  });

  return { success: true, data: undefined };
}
