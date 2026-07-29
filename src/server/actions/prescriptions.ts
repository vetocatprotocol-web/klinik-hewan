"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import { generatePrescriptionNumber } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export async function getPrescriptions({ page = 1, search = "" }: { page?: number; search?: string }) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const where: Prisma.PrescriptionWhereInput = {
    ...(search ? {
      OR: [
        { prescriptionNumber: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const PAGE_SIZE = 20;
  const [data, total] = await Promise.all([
    client.prescription.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        pet: { select: { name: true, species: true } },
        prescriptionItems: { include: { drug: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.prescription.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getPrescriptionById(id: string) {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  return client.prescription.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      pet: { select: { name: true, species: true, breed: true } },
      prescriptionItems: { include: { drug: true } },
      visit: { select: { visitNumber: true, diagnosis: true } },
    },
  });
}

export async function updatePrescriptionStatus(
  id: string,
  status: "COMPLETED" | "CANCELLED"
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "DOKTER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const prescription = await client.prescription.findUnique({ where: { id } });
  if (!prescription) {
    return { success: false, error: { message: "Resep tidak ditemukan", code: "NOT_FOUND" } };
  }

  await client.prescription.update({
    where: { id },
    data: { status },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Prescription",
    entityId: id,
    changes: { status: { old: prescription.status, new: status } },
  });

  return { success: true, data: undefined };
}

export async function generatePrescription(visitId: string): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const visit = await client.visit.findUnique({
    where: { id: visitId },
    include: { visitItems: true, prescription: true },
  });

  if (!visit) {
    return { success: false, error: { message: "Kunjungan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (visit.status !== "COMPLETED") {
    return { success: false, error: { message: "Hanya kunjungan COMPLETED yang bisa dibuatkan resep", code: "BUSINESS_RULE" } };
  }

  if (visit.prescription) {
    return { success: false, error: { message: "Kunjungan ini sudah memiliki resep", code: "BUSINESS_RULE" } };
  }

  const drugItems = visit.visitItems.filter((item) => item.itemType === "DRUG");
  if (drugItems.length === 0) {
    return { success: false, error: { message: "Tidak ada item obat pada kunjungan ini", code: "BUSINESS_RULE" } };
  }

  const now = new Date();
  const prescriptionNumber = generatePrescriptionNumber(now);

  const prescription = await client.prescription.create({
    data: {
      prescriptionNumber,
      visitId: visit.id,
      customerId: visit.customerId,
      petId: visit.petId,
      prescriptionDate: now,
      status: "ACTIVE",
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

  await createAuditLog({
    userId,
    action: "CREATE",
    entityType: "Prescription",
    entityId: prescription.id,
    changes: { prescriptionNumber: { old: null, new: prescriptionNumber } },
  });

  return { success: true, data: prescription.id };
}

export async function completePrescription(prescriptionId: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const prescription = await client.prescription.findUnique({ where: { id: prescriptionId } });
  if (!prescription) {
    return { success: false, error: { message: "Resep tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (prescription.status === "COMPLETED") {
    return { success: false, error: { message: "Resep sudah COMPLETED", code: "BUSINESS_RULE" } };
  }

  if (prescription.status === "CANCELLED") {
    return { success: false, error: { message: "Resep sudah CANCELLED", code: "BUSINESS_RULE" } };
  }

  await client.prescription.update({
    where: { id: prescriptionId },
    data: { status: "COMPLETED" },
  });

  await createAuditLog({
    userId,
    action: "STATUS_CHANGE",
    entityType: "Prescription",
    entityId: prescriptionId,
    changes: { status: { old: prescription.status, new: "COMPLETED" } },
  });

  return { success: true, data: undefined };
}

export async function cancelPrescription(prescriptionId: string, reason: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const prescription = await client.prescription.findUnique({ where: { id: prescriptionId } });
  if (!prescription) {
    return { success: false, error: { message: "Resep tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (prescription.status === "COMPLETED") {
    return { success: false, error: { message: "Resep sudah COMPLETED tidak bisa dibatalkan", code: "BUSINESS_RULE" } };
  }

  if (prescription.status === "CANCELLED") {
    return { success: false, error: { message: "Resep sudah CANCELLED", code: "BUSINESS_RULE" } };
  }

  await client.prescription.update({
    where: { id: prescriptionId },
    data: { status: "CANCELLED" },
  });

  await createAuditLog({
    userId,
    action: "STATUS_CHANGE",
    entityType: "Prescription",
    entityId: prescriptionId,
    changes: {
      status: { old: prescription.status, new: "CANCELLED" },
      reason: { old: null, new: reason },
    },
  });

  return { success: true, data: undefined };
}
