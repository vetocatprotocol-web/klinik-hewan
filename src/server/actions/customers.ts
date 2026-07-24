"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { customerSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateTempPassword(): string {
  const bytes = crypto.randomBytes(12);
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  // Ensure at least one uppercase, one lowercase, one number
  password = password.slice(0, 9) + "A1b";
  return password;
}

export async function createCustomer(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "DOKTER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || undefined,
    address: formData.get("address") as string,
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

  // PRD 8.2.1: "Duplicate check based on exact name + phone combination"
  const existing = await prisma.customer.findFirst({
    where: { 
      name: { equals: data.name, mode: "insensitive" },
      phone: data.phone 
    },
  });
  if (existing) {
    return {
      success: false,
      error: { message: "Pelanggan dengan nama dan nomor HP yang sama sudah terdaftar", field: "phone" },
    };
  }

  // Also check phone uniqueness independently (DB constraint)
  const phoneExists = await prisma.customer.findFirst({
    where: { phone: data.phone },
  });
  if (phoneExists) {
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

  // PRD 8.2.1: "System auto-generates user account with temporary password sent via email"
  let tempPassword = "";
  if (data.email) {
    tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const customerRole = await prisma.role.findFirst({ where: { name: "CUSTOMER" } });

    if (customerRole) {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          roleId: customerRole.id,
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
    changes: {
      name: { old: null, new: data.name },
      phone: { old: null, new: data.phone },
    },
  });

  // Send welcome email with portal credentials if email provided
  if (data.email && tempPassword) {
    try {
      const { sendEmail, generateCustomerRegistrationEmail } = await import("../lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      await sendEmail({
        to: data.email,
        subject: "Selamat Datang di Klinik Hewan PetCare",
        html: generateCustomerRegistrationEmail({
          customerName: data.name,
          email: data.email,
          tempPassword,
          loginUrl: `${appUrl}/login`,
        }),
      });
    } catch (error) {
      console.error("Failed to send customer registration email:", error);
    }
  }

  // PRD §18.1: Notify Owner when new customer is registered
  try {
    const { sendEmail, generateNewCustomerNotificationEmail } = await import("../lib/email");
    const ownerUser = await prisma.user.findFirst({
      where: { role: { name: "OWNER" }, status: "ACTIVE" },
      select: { email: true },
    });
    if (ownerUser?.email) {
      await sendEmail({
        to: ownerUser.email,
        subject: `Pelanggan Baru: ${data.name}`,
        html: generateNewCustomerNotificationEmail({
          customerName: data.name,
          customerPhone: data.phone,
        }),
      });
    }
  } catch (error) {
    console.error("Failed to send owner notification:", error);
  }

  // Notify owners about new customer registration
  try {
    const { createBulkNotifications } = await import("../lib/notifications");
    const owners = await prisma.user.findMany({
      where: { role: { name: "OWNER" }, status: "ACTIVE" },
    });
    if (owners.length > 0) {
      await createBulkNotifications(
        owners.map((o) => o.id),
        "Pelanggan Baru",
        `Pelanggan baru ${data.name} telah terdaftar`,
        "info"
      );
    }
  } catch (error) {
    console.error("Failed to send customer registration notification:", error);
  }

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

  // Portal users can only update their own customer record
  const role = (session.user as any).role;
  const staffRoles = ["OWNER", "DOKTER", "KASIR", "ADMIN"];
  if (!staffRoles.includes(role)) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.userId !== session.user.id) {
      return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
    }
  }

  const data = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || undefined,
    address: formData.get("address") as string,
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

  // PRD 8.2.1: "Duplicate check based on exact name + phone combination"
  const existing = await prisma.customer.findFirst({
    where: { 
      name: { equals: data.name, mode: "insensitive" },
      phone: data.phone,
      id: { not: id }
    },
  });
  if (existing) {
    return {
      success: false,
      error: { message: "Pelanggan dengan nama dan nomor HP yang sama sudah terdaftar", field: "phone" },
    };
  }

  // Also check phone uniqueness independently
  const phoneExists = await prisma.customer.findFirst({
    where: { phone: data.phone, id: { not: id } },
  });
  if (phoneExists) {
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
      address: { old: oldCustomer?.address, new: data.address },
      email: { old: oldCustomer?.email, new: data.email },
    },
  });

  return { success: true, data: id };
}

export async function archiveCustomer(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengarsipkan pelanggan", code: "FORBIDDEN" } };
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
    changes: {
      status: { old: "ACTIVE", new: "INACTIVE" },
    },
  });

  return { success: true, data: undefined };
}
