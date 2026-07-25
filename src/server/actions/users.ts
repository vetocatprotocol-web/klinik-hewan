"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { userSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import bcrypt from "bcryptjs";

export async function createUser(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    roleId: formData.get("roleId") as string,
    password: (formData.get("password") as string) || undefined,
  };

  const validated = userSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await client.user.findFirst({ where: { email: data.email } });
  if (existing) {
    return { success: false, error: { message: "Email sudah terdaftar", field: "email" } };
  }

  const password = data.password || Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await client.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      roleId: data.roleId,
      password: hashedPassword,
      status: "ACTIVE",
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true, data: user.id };
}

export async function updateUser(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    roleId: formData.get("roleId") as string,
  };

  const validated = userSchema.safeParse({ ...data, password: undefined });
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await client.user.findFirst({ where: { email: data.email, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Email sudah terdaftar", field: "email" } };
  }

  await client.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      roleId: data.roleId,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
  });

  return { success: true, data: id };
}

export async function disableUser(id: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  if (session.user.id === id) {
    return { success: false, error: { message: "Tidak bisa menonaktifkan akun sendiri", code: "BUSINESS_RULE" } };
  }

  await client.user.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    changes: { status: { old: "ACTIVE", new: "INACTIVE" } },
  });

  return { success: true, data: undefined };
}

export async function enableUser(id: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  await client.user.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    changes: { status: { old: "INACTIVE", new: "ACTIVE" } },
  });

  return { success: true, data: undefined };
}

export async function resetUserPassword(id: string): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await client.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    changes: { password: { old: "****", new: "reset" } },
  });

  return { success: true, data: tempPassword };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const user = await client.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { success: false, error: { message: "User tidak ditemukan", code: "NOT_FOUND" } };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: { message: "Password lama salah", field: "currentPassword" } };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await client.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return { success: true, data: undefined };
}

export async function updateUserRole(userId: string, roleId: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: { message: "User tidak ditemukan", code: "NOT_FOUND" } };
  }

  const oldRoleId = user.roleId;

  await client.user.update({
    where: { id: userId },
    data: { roleId },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: userId,
    changes: { roleId: { old: oldRoleId, new: roleId } },
  });

  return { success: true, data: undefined };
}

export async function getUserActivity(userId: string): Promise<ActionResult<any[]>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const logs = await client.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: logs };
}

export async function lockUser(userId: string, durationMinutes: number): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  if (session.user.id === userId) {
    return { success: false, error: { message: "Tidak bisa mengunci akun sendiri", code: "BUSINESS_RULE" } };
  }

  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: { message: "User tidak ditemukan", code: "NOT_FOUND" } };
  }

  const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

  await client.user.update({
    where: { id: userId },
    data: { lockedUntil },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: userId,
    changes: { lockedUntil: { old: null, new: lockedUntil.toISOString() } },
  });

  return { success: true, data: undefined };
}

export async function unlockUser(userId: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: { message: "User tidak ditemukan", code: "NOT_FOUND" } };
  }

  await client.user.update({
    where: { id: userId },
    data: { lockedUntil: null },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: userId,
    changes: { lockedUntil: { old: user.lockedUntil?.toISOString() || null, new: null } },
  });

  return { success: true, data: undefined };
}

export async function getFailedLoginAttempts(userId: string): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    return { success: false, error: { message: "User tidak ditemukan", code: "NOT_FOUND" } };
  }

  const isLocked = user.lockedUntil !== null && new Date(user.lockedUntil) > new Date();

  return {
    success: true,
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      isLocked,
    },
  };
}
