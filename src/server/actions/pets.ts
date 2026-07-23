"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { petSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

export async function createPet(
  customerId: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const data = {
    name: formData.get("name") as string,
    species: formData.get("species") as string,
    breed: (formData.get("breed") as string) || undefined,
    birthDate: (formData.get("birthDate") as string) || undefined,
    weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : undefined,
    colorMarking: (formData.get("colorMarking") as string) || undefined,
    medicalHistoryNotes: (formData.get("medicalHistoryNotes") as string) || undefined,
  };

  const validated = petSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return {
      success: false,
      error: { message: fieldError.message, field: fieldError.path[0] as string },
    };
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return { success: false, error: { message: "Pelanggan tidak ditemukan", code: "NOT_FOUND" } };
  }

  const pet = await prisma.pet.create({
    data: {
      customerId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      weightKg: data.weightKg,
      colorMarking: data.colorMarking,
      medicalHistoryNotes: data.medicalHistoryNotes,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Pet",
    entityId: pet.id,
    changes: { name: { old: null, new: data.name } },
  });

  return { success: true, data: pet.id };
}

export async function updatePet(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const data = {
    name: formData.get("name") as string,
    species: formData.get("species") as string,
    breed: (formData.get("breed") as string) || undefined,
    birthDate: (formData.get("birthDate") as string) || undefined,
    weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : undefined,
    colorMarking: (formData.get("colorMarking") as string) || undefined,
    medicalHistoryNotes: (formData.get("medicalHistoryNotes") as string) || undefined,
  };

  const validated = petSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return {
      success: false,
      error: { message: fieldError.message, field: fieldError.path[0] as string },
    };
  }

  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) {
    return { success: false, error: { message: "Hewan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (pet.status === "ARCHIVED") {
    return { success: false, error: { message: "Tidak bisa mengubah hewan yang sudah diarsipkan", code: "BUSINESS_RULE" } };
  }

  await prisma.pet.update({
    where: { id },
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      weightKg: data.weightKg,
      colorMarking: data.colorMarking,
      medicalHistoryNotes: data.medicalHistoryNotes,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Pet",
    entityId: id,
    changes: { name: { old: pet.name, new: data.name } },
  });

  return { success: true, data: id };
}

export async function archivePet(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) {
    return { success: false, error: { message: "Hewan tidak ditemukan", code: "NOT_FOUND" } };
  }

  await prisma.pet.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Pet",
    entityId: id,
  });

  return { success: true, data: undefined };
}
