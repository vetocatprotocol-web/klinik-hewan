"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { visitSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { generateVisitNumber, generateInvoiceNumber, generatePrescriptionNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";

export async function createVisit(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (role !== "DOKTER") {
    return { success: false, error: { message: "Hanya Dokter yang bisa membuat kunjungan", code: "FORBIDDEN" } };
  }

  const servicesJson = formData.get("services") as string;
  const drugsJson = formData.get("drugs") as string;

  const services = servicesJson ? JSON.parse(servicesJson) : [];
  const drugs = drugsJson ? JSON.parse(drugsJson) : [];

  const data = {
    customerId: formData.get("customerId") as string,
    petId: formData.get("petId") as string,
    visitDate: formData.get("visitDate") as string,
    chiefComplaint: formData.get("chiefComplaint") as string,
    physicalExamNotes: (formData.get("physicalExamNotes") as string) || undefined,
    diagnosis: formData.get("diagnosis") as string,
    treatmentNotes: (formData.get("treatmentNotes") as string) || undefined,
    weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : undefined,
    temperature: formData.get("temperature") ? Number(formData.get("temperature")) : undefined,
    heartRate: formData.get("heartRate") ? Number(formData.get("heartRate")) : undefined,
    services,
    drugs,
  };

  const validated = visitSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return {
      success: false,
      error: { message: fieldError.message, field: fieldError.path[0] as string },
    };
  }

  if (services.length === 0 && drugs.length === 0) {
    return {
      success: false,
      error: { message: "Pilih minimal 1 layanan atau obat", field: "services" },
    };
  }

  // Get prices from master data
  const serviceIds = services.map((s: any) => s.serviceId);
  const drugIds = drugs.map((d: any) => d.drugId);

  const [masterServices, masterDrugs] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: serviceIds }, status: "ACTIVE" } }),
    prisma.drug.findMany({ where: { id: { in: drugIds }, status: "ACTIVE" } }),
  ]);

  const serviceMap = new Map(masterServices.map((s) => [s.id, s]));
  const drugMap = new Map(masterDrugs.map((d) => [d.id, d]));

  const now = new Date();
  const visitNumber = generateVisitNumber(now);

  const visit = await prisma.visit.create({
    data: {
      visitNumber,
      customerId: data.customerId,
      petId: data.petId,
      visitDate: new Date(data.visitDate),
      chiefComplaint: data.chiefComplaint,
      physicalExamNotes: data.physicalExamNotes,
      diagnosis: data.diagnosis,
      treatmentNotes: data.treatmentNotes,
      weightKg: data.weightKg,
      temperature: data.temperature,
      heartRate: data.heartRate,
      createdBy: session.user.id!,
      status: "DRAFT",
      visitItems: {
        create: [
          ...services.map((s: any) => {
            const master = serviceMap.get(s.serviceId);
            return {
              itemType: "SERVICE",
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: Number(master?.price || 0),
              subtotal: Number(master?.price || 0) * s.quantity,
            };
          }),
          ...drugs.map((d: any) => {
            const master = drugMap.get(d.drugId);
            return {
              itemType: "DRUG",
              drugId: d.drugId,
              quantity: d.quantity,
              unitPrice: Number(master?.pricePerUnit || 0),
              subtotal: Number(master?.pricePerUnit || 0) * d.quantity,
              dosage: d.dosage || null,
              durationDays: d.durationDays || null,
              instructions: d.instructions || null,
            };
          }),
        ],
      },
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Visit",
    entityId: visit.id,
    changes: { visitNumber: { old: null, new: visitNumber } },
  });

  return { success: true, data: visit.id };
}

export async function completeVisit(id: string): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "DOKTER"].includes(role)) {
    return { success: false, error: { message: "Hanya Dokter atau Owner yang bisa menyelesaikan kunjungan", code: "FORBIDDEN" } };
  }

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      visitItems: true,
      customer: { select: { id: true, name: true, email: true, userId: true } },
      pet: { select: { name: true } },
    },
  });

  if (!visit) {
    return { success: false, error: { message: "Kunjungan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (visit.status !== "DRAFT") {
    return { success: false, error: { message: "Hanya kunjungan DRAFT yang bisa diselesaikan", code: "BUSINESS_RULE" } };
  }

  if (visit.visitItems.length === 0) {
    return { success: false, error: { message: "Kunjungan harus memiliki minimal 1 layanan atau obat", code: "BUSINESS_RULE" } };
  }

  const now = new Date();

  // Calculate totals
  const subtotal = visit.visitItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

  // Get tax config
  const taxSetting = await prisma.setting.findUnique({ where: { key: "tax_config" } });
  const taxConfig = taxSetting?.value as any;
  let taxAmount = 0;
  if (taxConfig?.enabled) {
    if (taxConfig.type === "PERCENTAGE") {
      taxAmount = subtotal * (taxConfig.value / 100);
    } else {
      taxAmount = taxConfig.value;
    }
  }

  const total = subtotal + taxAmount;

  // Get service and drug names for invoice items
  const serviceIds = visit.visitItems.filter(i => i.serviceId).map(i => i.serviceId!);
  const drugIds = visit.visitItems.filter(i => i.drugId).map(i => i.drugId!);
  const [masterServices, masterDrugs] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } }),
    prisma.drug.findMany({ where: { id: { in: drugIds } }, select: { id: true, name: true } }),
  ]);

  // Create invoice + prescription + status update in a single transaction
  const invoiceNumber = generateInvoiceNumber(now);
  let prescriptionNumber: string | null = null;

  const result = await prisma.$transaction(async (tx) => {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: visit.customerId,
        petId: visit.petId,
        sourceType: "VISIT",
        sourceId: id,
        invoiceDate: now,
        dueDate,
        subtotal,
        taxAmount,
        total,
        paidAmount: 0,
        status: "UNPAID",
        invoiceItems: {
          create: visit.visitItems.map((item) => {
            const itemName = item.serviceId
              ? (masterServices.find((s) => s.id === item.serviceId)?.name || "Layanan")
              : (masterDrugs.find((d) => d.id === item.drugId)?.name || "Obat");
            return {
              itemName,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
              category: item.itemType,
            };
          }),
        },
      },
    });

    const drugItems = visit.visitItems.filter((item) => item.itemType === "DRUG");
    if (drugItems.length > 0) {
      prescriptionNumber = generatePrescriptionNumber(now);
      await tx.prescription.create({
        data: {
          prescriptionNumber,
          visitId: id,
          customerId: visit.customerId,
          petId: visit.petId,
          prescriptionDate: now,
          prescriptionItems: {
            create: drugItems.map((item) => ({
              drugId: item.drugId!,
              quantity: item.quantity,
              dosage: item.dosage || null,
              durationDays: item.durationDays || null,
              instructions: item.instructions || null,
            })),
          },
        },
      });
    }

    await tx.visit.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    return { invoiceId: invoice.id };
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Visit",
    entityId: id,
    changes: { status: { old: "DRAFT", new: "COMPLETED" } },
  });

  // Notify customer via email if they have a user account
  if (visit.customer.email) {
    try {
      const { sendEmail, generateVisitCompletedEmail } = await import("../lib/email");
      await sendEmail({
        to: visit.customer.email,
        subject: `Kunjungan ${visit.visitNumber} telah selesai`,
        html: generateVisitCompletedEmail({
          customerName: visit.customer.name,
          petName: visit.pet.name,
          visitNumber: visit.visitNumber,
          diagnosis: visit.diagnosis,
          invoiceNumber,
        }),
      });
    } catch (error) {
      console.error("Failed to send visit completion email:", error);
    }
  }

  // Notify customer via in-app notification if they have a user account
  if (visit.customer.userId) {
    await createNotification({
      userId: visit.customer.userId,
      title: "Kunjungan Selesai",
      message: `Kunjungan ${visit.pet.name} dengan nomor ${visit.visitNumber} telah selesai. Invoice ${invoiceNumber} telah dibuat.`,
      type: "info",
    });
  }

  // Send invoice email to customer
  if (visit.customer.email) {
    try {
      const { sendEmail, generateInvoiceEmail } = await import("../lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendEmail({
        to: visit.customer.email,
        subject: `Invoice Baru - ${invoiceNumber}`,
        html: generateInvoiceEmail({
          customerName: visit.customer.name,
          invoiceNumber,
          total: total,
          invoiceUrl: `${appUrl}/portal/invoices/${result.invoiceId}`,
        }),
      });
    } catch (error) {
      console.error("Failed to send invoice email:", error);
    }
  }

  return { success: true, data: result.invoiceId };
}

export async function updateVisit(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "DOKTER"].includes(role)) {
    return { success: false, error: { message: "Hanya Dokter atau Owner yang bisa mengubah kunjungan", code: "FORBIDDEN" } };
  }

  const existingVisit = await prisma.visit.findUnique({ where: { id } });
  if (!existingVisit) {
    return { success: false, error: { message: "Kunjungan tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (existingVisit.status !== "DRAFT") {
    return { success: false, error: { message: "Hanya kunjungan DRAFT yang bisa diubah", code: "BUSINESS_RULE" } };
  }

  const servicesJson = formData.get("services") as string;
  const drugsJson = formData.get("drugs") as string;

  const services = servicesJson ? JSON.parse(servicesJson) : [];
  const drugs = drugsJson ? JSON.parse(drugsJson) : [];

  const data = {
    customerId: formData.get("customerId") as string,
    petId: formData.get("petId") as string,
    visitDate: formData.get("visitDate") as string,
    chiefComplaint: formData.get("chiefComplaint") as string,
    physicalExamNotes: (formData.get("physicalExamNotes") as string) || undefined,
    diagnosis: formData.get("diagnosis") as string,
    treatmentNotes: (formData.get("treatmentNotes") as string) || undefined,
    weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : undefined,
    temperature: formData.get("temperature") ? Number(formData.get("temperature")) : undefined,
    heartRate: formData.get("heartRate") ? Number(formData.get("heartRate")) : undefined,
    services,
    drugs,
  };

  const validated = visitSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return {
      success: false,
      error: { message: fieldError.message, field: fieldError.path[0] as string },
    };
  }

  if (services.length === 0 && drugs.length === 0) {
    return {
      success: false,
      error: { message: "Pilih minimal 1 layanan atau obat", field: "services" },
    };
  }

  const serviceIds = services.map((s: any) => s.serviceId);
  const drugIds = drugs.map((d: any) => d.drugId);

  const [masterServices, masterDrugs] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: serviceIds }, status: "ACTIVE" } }),
    prisma.drug.findMany({ where: { id: { in: drugIds }, status: "ACTIVE" } }),
  ]);

  const serviceMap = new Map(masterServices.map((s) => [s.id, s]));
  const drugMap = new Map(masterDrugs.map((d) => [d.id, d]));

  await prisma.visitItem.deleteMany({ where: { visitId: id } });

  await prisma.visit.update({
    where: { id },
    data: {
      customerId: data.customerId,
      petId: data.petId,
      visitDate: new Date(data.visitDate),
      chiefComplaint: data.chiefComplaint,
      physicalExamNotes: data.physicalExamNotes,
      diagnosis: data.diagnosis,
      treatmentNotes: data.treatmentNotes,
      weightKg: data.weightKg,
      temperature: data.temperature,
      heartRate: data.heartRate,
      visitItems: {
        create: [
          ...services.map((s: any) => {
            const master = serviceMap.get(s.serviceId);
            return {
              itemType: "SERVICE",
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: Number(master?.price || 0),
              subtotal: Number(master?.price || 0) * s.quantity,
            };
          }),
          ...drugs.map((d: any) => {
            const master = drugMap.get(d.drugId);
            return {
              itemType: "DRUG",
              drugId: d.drugId,
              quantity: d.quantity,
              unitPrice: Number(master?.pricePerUnit || 0),
              subtotal: Number(master?.pricePerUnit || 0) * d.quantity,
              dosage: d.dosage || null,
              durationDays: d.durationDays || null,
              instructions: d.instructions || null,
            };
          }),
        ],
      },
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Visit",
    entityId: id,
  });

  return { success: true, data: id };
}

export async function addVisitItem(
  visitId: string,
  itemType: "SERVICE" | "DRUG",
  itemId: string,
  quantity: number
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "DOKTER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) {
    return { success: false, error: { message: "Kunjungan tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (visit.status !== "DRAFT") {
    return { success: false, error: { message: "Hanya kunjungan DRAFT yang bisa ditambah itemnya", code: "BUSINESS_RULE" } };
  }

  let unitPrice = 0;
  if (itemType === "SERVICE") {
    const service = await prisma.service.findUnique({ where: { id: itemId } });
    if (!service || service.status !== "ACTIVE") {
      return { success: false, error: { message: "Layanan tidak ditemukan atau tidak aktif", code: "NOT_FOUND" } };
    }
    unitPrice = Number(service.price);
  } else {
    const drug = await prisma.drug.findUnique({ where: { id: itemId } });
    if (!drug || drug.status !== "ACTIVE") {
      return { success: false, error: { message: "Obat tidak ditemukan atau tidak aktif", code: "NOT_FOUND" } };
    }
    unitPrice = Number(drug.pricePerUnit);
  }

  const item = await prisma.visitItem.create({
    data: {
      visitId,
      itemType,
      serviceId: itemType === "SERVICE" ? itemId : null,
      drugId: itemType === "DRUG" ? itemId : null,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "VisitItem",
    entityId: item.id,
    changes: { visitId: { old: null, new: visitId }, itemType: { old: null, new: itemType } },
  });

  return { success: true, data: item.id };
}

export async function removeVisitItem(
  visitId: string,
  itemId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "DOKTER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) {
    return { success: false, error: { message: "Kunjungan tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (visit.status !== "DRAFT") {
    return { success: false, error: { message: "Hanya kunjungan DRAFT yang bisa dihapus itemnya", code: "BUSINESS_RULE" } };
  }

  const item = await prisma.visitItem.findFirst({
    where: { id: itemId, visitId },
  });
  if (!item) {
    return { success: false, error: { message: "Item tidak ditemukan", code: "NOT_FOUND" } };
  }

  await prisma.visitItem.delete({ where: { id: itemId } });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "VisitItem",
    entityId: itemId,
  });

  return { success: true, data: undefined };
}
