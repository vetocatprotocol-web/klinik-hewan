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

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      visitItems: true,
      customer: { select: { id: true, name: true, email: true } },
      pet: { select: { name: true } },
    },
  });

  if (!visit) {
    return { success: false, error: { message: "Kunjungan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (visit.status !== "DRAFT") {
    return { success: false, error: { message: "Hanya kunjungan DRAFT yang bisa diselesaikan", code: "BUSINESS_RULE" } };
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

  // Create invoice
  const invoiceNumber = generateInvoiceNumber(now);
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: visit.customerId,
      petId: visit.petId,
      sourceType: "VISIT",
      sourceId: id,
      invoiceDate: now,
      subtotal,
      taxAmount,
      total,
      paidAmount: 0,
      status: "UNPAID",
      invoiceItems: {
        create: visit.visitItems.map((item) => ({
          itemName: item.serviceId ? `Layanan` : `Obat`,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          category: item.itemType,
        })),
      },
    },
  });

  // Create prescription if there are drug items
  const drugItems = visit.visitItems.filter((item) => item.itemType === "DRUG");
  if (drugItems.length > 0) {
    const prescriptionNumber = generatePrescriptionNumber(now);
    await prisma.prescription.create({
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
          })),
        },
      },
    });
  }

  // Update visit status
  await prisma.visit.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Visit",
    entityId: id,
    changes: { status: { old: "DRAFT", new: "COMPLETED" } },
  });

  // Notify customer if has user account
  if (visit.customer.email) {
    const owners = await prisma.user.findMany({
      where: { role: { name: "OWNER" }, status: "ACTIVE" },
    });
    for (const owner of owners) {
      await createNotification({
        userId: owner.id,
        title: "Kunjungan Selesai",
        message: `Kunjungan ${visit.customer.name} - ${visit.pet.name} telah selesai`,
        type: "info",
      });
    }
  }

  return { success: true, data: invoice.id };
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
