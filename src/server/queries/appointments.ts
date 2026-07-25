import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { PAGE_SIZE } from "@/lib/constants";

export async function getAppointments({
  page = 1,
  search = "",
  status,
  doctorId,
  customerId,
  dateFrom,
  dateTo,
}: {
  page?: number;
  search?: string;
  status?: string;
  doctorId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const cacheKey = `appointments:${page}:${search}:${status}:${doctorId}:${customerId}:${dateFrom}:${dateTo}`;
  return cached(cacheKey, async () => {
    const client = await prisma();
    const where: any = {};
    if (search) {
      where.OR = [
        { appointmentNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { pet: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (customerId) where.customerId = customerId;
    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) where.appointmentDate.gte = new Date(dateFrom);
      if (dateTo) where.appointmentDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      client.appointment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          pet: { select: { id: true, name: true, species: true } },
          doctor: { select: { id: true, name: true } },
        },
        orderBy: [{ appointmentDate: "desc" }, { time: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.appointment.count({ where }),
    ]);

    return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }, 10_000);
}

export async function getAppointmentById(id: string) {
  const client = await prisma();
  return client.appointment.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      pet: { select: { id: true, name: true, species: true, breed: true } },
      doctor: { select: { id: true, name: true } },
      visits: { select: { id: true, visitNumber: true, status: true } },
    },
  });
}

export async function getTodayAppointments(doctorId?: string) {
  const client = await prisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where: any = {
    appointmentDate: { gte: today, lt: tomorrow },
    status: { notIn: ["CANCELLED"] },
  };
  if (doctorId) where.doctorId = doctorId;

  return client.appointment.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      pet: { select: { id: true, name: true, species: true } },
      doctor: { select: { id: true, name: true } },
    },
    orderBy: { time: "asc" },
  });
}

export async function getDoctorSchedule(doctorId: string) {
  const client = await prisma();
  return client.doctorSchedule.findMany({
    where: { doctorId, status: "ACTIVE" },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function getDoctorAvailableDates(
  doctorId: string,
  month: number,
  year: number
) {
  const client = await prisma();

  const schedules = await client.doctorSchedule.findMany({
    where: { doctorId, status: "ACTIVE" },
  });

  const activeDays = new Set(schedules.map((s) => s.dayOfWeek));

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const appointments = await client.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: firstDay, lte: lastDay },
      status: { notIn: ["CANCELLED"] },
    },
    select: { appointmentDate: true, time: true },
  });

  const slotCounts: Record<string, Record<string, number>> = {};
  for (const appt of appointments) {
    const dateKey = appt.appointmentDate.toISOString().split("T")[0];
    if (!slotCounts[dateKey]) slotCounts[dateKey] = {};
    slotCounts[dateKey][appt.time] = (slotCounts[dateKey][appt.time] || 0) + 1;
  }

  const availableDates: { date: string; availableSlots: number }[] = [];
  const current = new Date(firstDay);

  while (current <= lastDay) {
    const dayOfWeek = current.getDay();
    if (activeDays.has(dayOfWeek)) {
      const dateKey = current.toISOString().split("T")[0];
      const schedule = schedules.find((s) => s.dayOfWeek === dayOfWeek)!;
      const bookedCount = Object.keys(slotCounts[dateKey] || {}).length;
      const totalSlots = Math.floor(
        (parseInt(schedule.endTime.split(":")[0]) * 60 + parseInt(schedule.endTime.split(":")[1]) -
          (parseInt(schedule.startTime.split(":")[0]) * 60 + parseInt(schedule.startTime.split(":")[1]))) /
          schedule.slotDuration
      );
      const availableSlots = totalSlots - bookedCount;
      if (availableSlots > 0) {
        availableDates.push({ date: dateKey, availableSlots });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return availableDates;
}
