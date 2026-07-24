"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

export async function getPrescriptions({ page = 1, search = "" }: { page?: number; search?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const where: any = {};
  if (search) {
    where.OR = [
      { prescriptionNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const PAGE_SIZE = 20;
  const [data, total] = await Promise.all([
    prisma.prescription.findMany({
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
    prisma.prescription.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getPrescriptionById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  return prisma.prescription.findUnique({
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
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "DOKTER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const prescription = await prisma.prescription.findUnique({ where: { id } });
  if (!prescription) {
    return { success: false, error: { message: "Resep tidak ditemukan", code: "NOT_FOUND" } };
  }

  await prisma.prescription.update({
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
