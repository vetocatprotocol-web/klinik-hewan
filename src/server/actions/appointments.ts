"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { generateAppointmentNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";

export async function createAppointment(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "KASIR", "CUSTOMER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const customerId = formData.get("customerId") as string;
  const petId = formData.get("petId") as string;
  const doctorId = formData.get("doctorId") as string;
  const appointmentDate = formData.get("appointmentDate") as string;
  const time = formData.get("time") as string;
  const type = (formData.get("type") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  if (!customerId || !petId || !doctorId || !appointmentDate || !time) {
    return { success: false, error: { message: "Semua field wajib harus diisi", code: "VALIDATION" } };
  }

  if (role === "CUSTOMER") {
    const customer = await client.customer.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    });
    if (!customer || customer.id !== customerId) {
      return { success: false, error: { message: "Pelanggan tidak valid", code: "BUSINESS_RULE" } };
    }
  }

  const [customer, pet, doctor] = await Promise.all([
    client.customer.findUnique({ where: { id: customerId }, select: { id: true, status: true, userId: true } }),
    client.pet.findUnique({ where: { id: petId }, select: { id: true, customerId: true, status: true } }),
    client.user.findUnique({ where: { id: doctorId }, select: { id: true, role: true, status: true } }),
  ]);

  if (!customer) {
    return { success: false, error: { message: "Pelanggan tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (customer.status !== "ACTIVE") {
    return { success: false, error: { message: "Pelanggan tidak aktif", code: "BUSINESS_RULE" } };
  }
  if (!pet) {
    return { success: false, error: { message: "Hewan tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (pet.customerId !== customerId) {
    return { success: false, error: { message: "Hewan tidak dimiliki oleh pelanggan ini", code: "BUSINESS_RULE" } };
  }
  if (pet.status !== "ACTIVE") {
    return { success: false, error: { message: "Hewan tidak aktif", code: "BUSINESS_RULE" } };
  }
  if (!doctor) {
    return { success: false, error: { message: "Dokter tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (doctor.status !== "ACTIVE") {
    return { success: false, error: { message: "Dokter tidak aktif", code: "BUSINESS_RULE" } };
  }

  const dateObj = new Date(appointmentDate);
  const dayOfWeek = dateObj.getDay();

  const schedule = await client.doctorSchedule.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });
  if (!schedule || schedule.status !== "ACTIVE") {
    return { success: false, error: { message: "Dokter tidak memiliki jadwal pada hari tersebut", code: "BUSINESS_RULE" } };
  }

  if (time < schedule.startTime || time >= schedule.endTime) {
    return { success: false, error: { message: "Waktu janji temu di luar jam praktik dokter", code: "BUSINESS_RULE" } };
  }

  const existingAppointment = await client.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate: dateObj,
      time,
      status: { notIn: ["CANCELLED"] },
    },
  });
  if (existingAppointment) {
    return { success: false, error: { message: "Slot waktu sudah terisi", code: "BUSINESS_RULE" } };
  }

  const now = new Date();
  const appointmentNumber = generateAppointmentNumber(now);

  const appointment = await client.appointment.create({
    data: {
      appointmentNumber,
      customerId,
      petId,
      doctorId,
      appointmentDate: dateObj,
      time,
      type,
      notes,
      status: "PENDING",
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Appointment",
    entityId: appointment.id,
    changes: { appointmentNumber: { old: null, new: appointmentNumber } },
  });

  return { success: true, data: appointment.id };
}

export async function updateAppointment(
  appointmentId: string,
  data: {
    customerId?: string;
    petId?: string;
    doctorId?: string;
    appointmentDate?: string;
    time?: string;
    type?: string;
    notes?: string;
  }
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const existing = await client.appointment.findUnique({ where: { id: appointmentId } });
  if (!existing) {
    return { success: false, error: { message: "Janji temu tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (existing.status !== "PENDING") {
    return { success: false, error: { message: "Hanya janji temu PENDING yang bisa diubah", code: "BUSINESS_RULE" } };
  }

  const updateData: Record<string, unknown> = {};

  if (data.customerId !== undefined) updateData.customerId = data.customerId;
  if (data.petId !== undefined) updateData.petId = data.petId;
  if (data.doctorId !== undefined) updateData.doctorId = data.doctorId;
  if (data.appointmentDate !== undefined) updateData.appointmentDate = new Date(data.appointmentDate);
  if (data.time !== undefined) updateData.time = data.time;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.notes !== undefined) updateData.notes = data.notes;

  if (data.doctorId || data.appointmentDate || data.time) {
    const doctorId = data.doctorId || existing.doctorId;
    const appointmentDate = data.appointmentDate ? new Date(data.appointmentDate) : existing.appointmentDate;
    const time = data.time || existing.time;

    const dateObj = new Date(appointmentDate);
    const dayOfWeek = dateObj.getDay();

    const schedule = await client.doctorSchedule.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
    });
    if (!schedule || schedule.status !== "ACTIVE") {
      return { success: false, error: { message: "Dokter tidak memiliki jadwal pada hari tersebut", code: "BUSINESS_RULE" } };
    }

    if (time < schedule.startTime || time >= schedule.endTime) {
      return { success: false, error: { message: "Waktu janji temu di luar jam praktik dokter", code: "BUSINESS_RULE" } };
    }

    const conflicting = await client.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: dateObj,
        time,
        status: { notIn: ["CANCELLED"] },
        id: { not: appointmentId },
      },
    });
    if (conflicting) {
      return { success: false, error: { message: "Slot waktu sudah terisi", code: "BUSINESS_RULE" } };
    }
  }

  const before = await client.appointment.findUnique({ where: { id: appointmentId } });
  await client.appointment.update({ where: { id: appointmentId }, data: updateData });

  const after = await client.appointment.findUnique({ where: { id: appointmentId } });
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  if (before && after) {
    for (const key of Object.keys(updateData)) {
      if (JSON.stringify(before[key as keyof typeof before]) !== JSON.stringify(after[key as keyof typeof after])) {
        changes[key] = { old: before[key as keyof typeof before], new: after[key as keyof typeof after] };
      }
    }
  }

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Appointment",
    entityId: appointmentId,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });

  return { success: true, data: appointmentId };
}

export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const existing = await client.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: { select: { userId: true, name: true } }, pet: { select: { name: true } } },
  });
  if (!existing) {
    return { success: false, error: { message: "Janji temu tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (existing.status === "CANCELLED") {
    return { success: false, error: { message: "Janji temu sudah dibatalkan", code: "BUSINESS_RULE" } };
  }
  if (existing.status === "COMPLETED") {
    return { success: false, error: { message: "Janji temu sudah selesai", code: "BUSINESS_RULE" } };
  }

  await client.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", notes: reason || existing.notes },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Appointment",
    entityId: appointmentId,
    changes: { status: { old: existing.status, new: "CANCELLED" } },
  });

  if (existing.customer.userId) {
    await createNotification({
      userId: existing.customer.userId,
      title: "Janji Temu Dibatalkan",
      message: `Janji temu ${existing.appointmentNumber} untuk ${existing.pet.name} telah dibatalkan.${reason ? ` Alasan: ${reason}` : ""}`,
      type: "warning",
    });
  }

  return { success: true, data: appointmentId };
}

export async function completeAppointment(
  appointmentId: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Hanya Dokter atau Owner yang bisa menyelesaikan janji temu", code: "FORBIDDEN" } };
  }

  const existing = await client.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: { select: { userId: true, name: true } }, pet: { select: { name: true } } },
  });
  if (!existing) {
    return { success: false, error: { message: "Janji temu tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (existing.status !== "CONFIRMED") {
    return { success: false, error: { message: "Hanya janji temu CONFIRMED yang bisa diselesaikan", code: "BUSINESS_RULE" } };
  }

  await client.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Appointment",
    entityId: appointmentId,
    changes: { status: { old: existing.status, new: "COMPLETED" } },
  });

  if (existing.customer.userId) {
    await createNotification({
      userId: existing.customer.userId,
      title: "Janji Temu Selesai",
      message: `Janji temu ${existing.appointmentNumber} untuk ${existing.pet.name} telah selesai.`,
      type: "info",
    });
  }

  return { success: true, data: appointmentId };
}

export async function confirmAppointment(
  appointmentId: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const existing = await client.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: { select: { userId: true, name: true } }, pet: { select: { name: true } } },
  });
  if (!existing) {
    return { success: false, error: { message: "Janji temu tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (existing.status !== "PENDING") {
    return { success: false, error: { message: "Hanya janji temu PENDING yang bisa dikonfirmasi", code: "BUSINESS_RULE" } };
  }

  await client.appointment.update({
    where: { id: appointmentId },
    data: { status: "CONFIRMED" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Appointment",
    entityId: appointmentId,
    changes: { status: { old: existing.status, new: "CONFIRMED" } },
  });

  if (existing.customer.userId) {
    await createNotification({
      userId: existing.customer.userId,
      title: "Janji Temu Dikonfirmasi",
      message: `Janji temu ${existing.appointmentNumber} untuk ${existing.pet.name} telah dikonfirmasi.`,
      type: "info",
    });
  }

  return { success: true, data: appointmentId };
}

export async function markNoShow(
  appointmentId: string,
  reason?: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["DOKTER", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Hanya Dokter atau Owner yang bisa menandai tidak hadir", code: "FORBIDDEN" } };
  }

  const existing = await client.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: { select: { userId: true, name: true } }, pet: { select: { name: true } } },
  });
  if (!existing) {
    return { success: false, error: { message: "Janji temu tidak ditemukan", code: "NOT_FOUND" } };
  }
  if (existing.status === "COMPLETED" || existing.status === "CANCELLED" || existing.status === "NO_SHOW") {
    return { success: false, error: { message: "Janji temu tidak bisa ditandai tidak hadir", code: "BUSINESS_RULE" } };
  }

  await client.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW", notes: reason || existing.notes },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "Appointment",
    entityId: appointmentId,
    changes: { status: { old: existing.status, new: "NO_SHOW" } },
  });

  if (existing.customer.userId) {
    await createNotification({
      userId: existing.customer.userId,
      title: "Janji Tidak Hadir",
      message: `Janji temu ${existing.appointmentNumber} untuk ${existing.pet.name} ditandai tidak hadir.${reason ? ` Alasan: ${reason}` : ""}`,
      type: "warning",
    });
  }

  return { success: true, data: appointmentId };
}

export async function getAvailableSlots(
  doctorId: string,
  date: string
): Promise<ActionResult<string[]>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();

  const schedule = await client.doctorSchedule.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });
  if (!schedule || schedule.status !== "ACTIVE") {
    return { success: false, error: { message: "Dokter tidak memiliki jadwal pada hari tersebut", code: "NOT_FOUND" } };
  }

  const existingAppointments = await client.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: dateObj,
      status: { notIn: ["CANCELLED"] },
    },
    select: { time: true },
  });

  const bookedSlots = new Set(existingAppointments.map((a) => a.time));
  const slots: string[] = [];

  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  for (let m = startMinutes; m < endMinutes; m += schedule.slotDuration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const slot = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    if (!bookedSlots.has(slot)) {
      slots.push(slot);
    }
  }

  return { success: true, data: slots };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDoctorSchedule(doctorId: string): Promise<ActionResult<any[]>> {
  const client = await prisma();

  const schedules = await client.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: "asc" },
  });

  return { success: true, data: schedules };
}
