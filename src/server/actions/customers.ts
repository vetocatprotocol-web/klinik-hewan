"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { customerSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import bcrypt from "bcryptjs";

export async function createCustomer(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const data = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postalCode: (formData.get("postalCode") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const validated = customerSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return {
      success: false,
      error: { message: fieldError.message, field: fieldError.path[0] as string },
    };
  }

  const existing = await prisma.customer.findFirst({
    where: { phone: data.phone },
  });
  if (existing) {
    return {
      success: false,
      error: { message: "Nomor HP sudah terdaftar", field: "phone" },
    };
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      notes: data.notes,
    },
  });

  // Auto-create user account if email provided
  if (data.email) {
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const role = await prisma.role.findFirst({ where: { name: "CUSTOMER" } });

    if (role) {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          roleId: role.id,
          status: "ACTIVE",
        },
      });

      await prisma.customer.update({
        where: { id: customer.id },
        data: { userId: user.id },
      });
    }
  }

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Customer",
    entityId: customer.id,
    changes: { name: { old: null, new: data.name } },
  });

  return { success: true, data: customer.id };
}

export async function updateCustomer(
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
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postalCode: (formData.get("postalCode") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const validated = customerSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return {
      success: false,
      error: { message: fieldError.message, field: fieldError.path[0] as string },
    };
  }

  const existing = await prisma.customer.findFirst({
    where: { phone: data.phone, id: { not: id } },
  });
  if (existing) {
    return {
      success: false,
      error: { message: "Nomor HP sudah terdaftar", field: "phone" },
    };
  }

  const oldCustomer = await prisma.customer.findUnique({ where: { id } });

  await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      notes: data.notes,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Customer",
    entityId: id,
    changes: {
      name: { old: oldCustomer?.name, new: data.name },
      phone: { old: oldCustomer?.phone, new: data.phone },
    },
  });

  return { success: true, data: id };
}

export async function archiveCustomer(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { visits: { where: { status: { in: ["DRAFT", "COMPLETED"] } } } },
  });

  if (!customer) {
    return { success: false, error: { message: "Pelanggan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (customer.visits.length > 0) {
    return {
      success: false,
      error: { message: "Tidak bisa mengarsipkan pelanggan dengan kunjungan aktif", code: "BUSINESS_RULE" },
    };
  }

  await prisma.customer.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Customer",
    entityId: id,
  });

  return { success: true, data: undefined };
}
