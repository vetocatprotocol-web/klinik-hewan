"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { petSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import { uploadFile } from "./uploads";

export async function createPet(
  customerId: string,
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
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

  // Verify customer exists
  const customer = await client.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return { success: false, error: { message: "Pelanggan tidak ditemukan", code: "NOT_FOUND" } };
  }

  // Authorization: staff can add pets to any customer, portal users only to own customer record
  const role = (session.user as { id: string; role: string }).role;
  const staffRoles = ["OWNER", "DOKTER", "KASIR"];
  if (!staffRoles.includes(role)) {
    // Portal user - verify ownership
    if (customer.userId !== session.user.id) {
      return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
    }
  }

  const pet = await client.pet.create({
    data: {
      customerId,
      name: data.name,
      species: data.species,
      breed: data.breed || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      weightKg: data.weightKg || null,
      colorMarking: data.colorMarking || null,
      medicalHistoryNotes: data.medicalHistoryNotes || null,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Pet",
    entityId: pet.id,
    changes: {
      name: { old: null, new: data.name },
      species: { old: null, new: data.species },
      customerId: { old: null, new: customerId },
    },
  });

  return { success: true, data: pet.id };
}

export async function updatePet(
  id: string,
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
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

  const pet = await client.pet.findUnique({ where: { id } });
  if (!pet) {
    return { success: false, error: { message: "Hewan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (pet.status === "ARCHIVED") {
    return { success: false, error: { message: "Tidak bisa mengubah hewan yang sudah diarsipkan", code: "BUSINESS_RULE" } };
  }

  // Authorization: staff can update any pet, portal users only own pets
  const role = (session.user as { id: string; role: string }).role;
  const staffRoles = ["OWNER", "DOKTER", "KASIR"];
  if (!staffRoles.includes(role)) {
    const customer = await client.customer.findUnique({ where: { id: pet.customerId } });
    if (!customer || customer.userId !== session.user.id) {
      return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
    }
  }

  const oldPet = await client.pet.findUnique({ where: { id } });

  await client.pet.update({
    where: { id },
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      weightKg: data.weightKg || null,
      colorMarking: data.colorMarking || null,
      medicalHistoryNotes: data.medicalHistoryNotes || null,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Pet",
    entityId: id,
    changes: {
      name: { old: oldPet?.name, new: data.name },
      species: { old: oldPet?.species, new: data.species },
      breed: { old: oldPet?.breed, new: data.breed || null },
      weightKg: { old: oldPet?.weightKg?.toString(), new: data.weightKg?.toString() },
    },
  });

  return { success: true, data: id };
}

export async function archivePet(id: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const pet = await client.pet.findUnique({ where: { id } });
  if (!pet) {
    return { success: false, error: { message: "Hewan tidak ditemukan", code: "NOT_FOUND" } };
  }

  // Authorization: staff can archive any pet, portal users only own pets
  const role = (session.user as { id: string; role: string }).role;
  const staffRoles = ["OWNER", "DOKTER", "KASIR"];
  if (!staffRoles.includes(role)) {
    const customer = await client.customer.findUnique({ where: { id: pet.customerId } });
    if (!customer || customer.userId !== session.user.id) {
      return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
    }
  }

  await client.pet.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Pet",
    entityId: id,
    changes: {
      status: { old: "ACTIVE", new: "ARCHIVED" },
    },
  });

  return { success: true, data: undefined };
}

export async function uploadPetPhoto(
  petId: string,
  file: File
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const pet = await client.pet.findUnique({ where: { id: petId } });
  if (!pet) {
    return { success: false, error: { message: "Hewan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (pet.status === "ARCHIVED") {
    return { success: false, error: { message: "Tidak bisa mengubah hewan yang sudah diarsipkan", code: "BUSINESS_RULE" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  const staffRoles = ["OWNER", "DOKTER", "KASIR"];
  if (!staffRoles.includes(role)) {
    const customer = await client.customer.findUnique({ where: { id: pet.customerId } });
    if (!customer || customer.userId !== session.user.id) {
      return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
    }
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: { message: "Tipe file tidak valid. Yang diizinkan: jpg, png, webp" },
    };
  }

  const uploadResult = await uploadFile(file, "pet-photos");
  if (!uploadResult.success) {
    return { success: false, error: uploadResult.error };
  }

  const oldImage = pet.image;

  await client.pet.update({
    where: { id: petId },
    data: { image: uploadResult.data!.url },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Pet",
    entityId: petId,
    changes: {
      image: { old: oldImage || null, new: uploadResult.data!.url },
    },
  });

  return { success: true, data: uploadResult.data!.url };
}
