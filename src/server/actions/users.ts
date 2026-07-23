"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { userSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import bcrypt from "bcryptjs";

export async function createUser(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
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

  const existing = await prisma.user.findFirst({ where: { email: data.email } });
  if (existing) {
    return { success: false, error: { message: "Email sudah terdaftar", field: "email" } };
  }

  const password = data.password || Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
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

  const existing = await prisma.user.findFirst({ where: { email: data.email, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Email sudah terdaftar", field: "email" } };
  }

  await prisma.user.update({
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
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  if (session.user.id === id) {
    return { success: false, error: { message: "Tidak bisa menonaktifkan akun sendiri", code: "BUSINESS_RULE" } };
  }

  await prisma.user.update({
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
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  await prisma.user.update({
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
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
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
