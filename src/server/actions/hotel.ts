"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { generateBookingNumber } from "@/lib/utils";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";

export async function createHotelBooking(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["KASIR", "CUSTOMER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const customerId = formData.get("customerId") as string;
  const petId = formData.get("petId") as string;
  const roomId = formData.get("roomId") as string;
  const checkInDate = new Date(formData.get("checkInDate") as string);
  const checkOutDate = new Date(formData.get("checkOutDate") as string);
  const serviceFee = Number(formData.get("serviceFee") || 0);
  const discountAmount = Number(formData.get("discountAmount") || 0);
  const notes = (formData.get("notes") as string) || undefined;

  if (!customerId || !petId || !roomId) {
    return { success: false, error: { message: "Data tidak lengkap", code: "VALIDATION" } };
  }

  if (checkOutDate <= checkInDate) {
    return { success: false, error: { message: "Tanggal check-out harus setelah check-in", code: "BUSINESS_RULE" } };
  }

  const room = await client.hotelRoom.findUnique({ where: { id: roomId } });
  if (!room) {
    return { success: false, error: { message: "Kamar tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (room.status !== "AVAILABLE") {
    return { success: false, error: { message: "Kamar tidak tersedia", code: "BUSINESS_RULE" } };
  }

  const conflictBooking = await client.hotelBooking.findFirst({
    where: {
      roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      checkInDate: { lt: checkOutDate },
      checkOutDate: { gt: checkInDate },
    },
  });

  if (conflictBooking) {
    return { success: false, error: { message: "Kamar sudah dipesan pada tanggal tersebut", code: "BUSINESS_RULE" } };
  }

  const now = new Date();
  const bookingNumber = generateBookingNumber(now);
  const totalDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyRate = Number(room.dailyRate);
  const subtotal = totalDays * dailyRate;
  const total = subtotal + serviceFee - discountAmount;

  const booking = await client.hotelBooking.create({
    data: {
      bookingNumber,
      customerId,
      petId,
      roomId,
      checkInDate,
      checkOutDate,
      dailyRate,
      totalDays,
      subtotal,
      serviceFee,
      discountAmount,
      total,
      status: "CONFIRMED",
      notes,
      createdBy: session.user.id!,
    },
  });

  await client.hotelRoom.update({
    where: { id: roomId },
    data: { currentOccupancy: { increment: 1 } },
  });

  const customer = await client.customer.findUnique({
    where: { id: customerId },
    select: { userId: true, name: true },
  });

  if (customer?.userId) {
    await createNotification({
      userId: customer.userId,
      title: "Booking Hotel Dikonfirmasi",
      message: `Booking ${bookingNumber} untuk kamar ${room.roomNumber} telah dikonfirmasi.`,
      type: "success",
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "HotelBooking",
    entityId: booking.id,
    changes: {
      bookingNumber: { old: null, new: bookingNumber },
      roomNumber: { old: null, new: room.roomNumber },
      checkInDate: { old: null, new: checkInDate.toISOString() },
      checkOutDate: { old: null, new: checkOutDate.toISOString() },
      total: { old: null, new: total },
    },
  });

  return { success: true, data: booking.id };
}

export async function updateHotelBooking(
  bookingId: string,
  data: { checkInDate?: string; checkOutDate?: string; serviceFee?: number; discountAmount?: number; notes?: string }
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const booking = await client.hotelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, error: { message: "Booking tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (booking.status === "CHECKED_OUT" || booking.status === "CANCELLED") {
    return { success: false, error: { message: "Tidak bisa mengubah booking yang sudah selesai atau dibatalkan", code: "BUSINESS_RULE" } };
  }

  const serviceFee = Number(data.serviceFee ?? booking.serviceFee);
  const discountAmount = Number(data.discountAmount ?? booking.discountAmount);
  let totalDays = data.checkInDate || data.checkOutDate
    ? Math.ceil(((data.checkOutDate ? new Date(data.checkOutDate) : booking.checkOutDate).getTime() - (data.checkInDate ? new Date(data.checkInDate) : booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : booking.totalDays;
  const dailyRate = Number(booking.dailyRate);
  const subtotal = totalDays * dailyRate;
  const total = subtotal + serviceFee - discountAmount;

  if (data.checkInDate || data.checkOutDate) {
    const newCheckIn = data.checkInDate ? new Date(data.checkInDate) : booking.checkInDate;
    const newCheckOut = data.checkOutDate ? new Date(data.checkOutDate) : booking.checkOutDate;

    if (newCheckOut <= newCheckIn) {
      return { success: false, error: { message: "Tanggal check-out harus setelah check-in", code: "BUSINESS_RULE" } };
    }

    totalDays = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24));
  }

  await client.hotelBooking.update({
    where: { id: bookingId },
    data: {
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.serviceFee !== undefined && { serviceFee: data.serviceFee }),
      ...(data.discountAmount !== undefined && { discountAmount: data.discountAmount }),
      ...(data.checkInDate && { checkInDate: new Date(data.checkInDate) }),
      ...(data.checkOutDate && { checkOutDate: new Date(data.checkOutDate) }),
      totalDays,
      subtotal: totalDays * dailyRate,
      total: totalDays * dailyRate + serviceFee - discountAmount,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "HotelBooking",
    entityId: bookingId,
    changes: {
      total: { old: Number(booking.total), new: total },
    },
  });

  return { success: true, data: bookingId };
}

export async function cancelHotelBooking(
  bookingId: string,
  reason: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["KASIR", "CUSTOMER", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const booking = await client.hotelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, error: { message: "Booking tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (booking.status === "CANCELLED") {
    return { success: false, error: { message: "Booking sudah dibatalkan", code: "BUSINESS_RULE" } };
  }

  if (booking.status === "CHECKED_OUT") {
    return { success: false, error: { message: "Tidak bisa membatalkan booking yang sudah check-out", code: "BUSINESS_RULE" } };
  }

  await client.$transaction([
    client.hotelBooking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", notes: reason },
    }),
    client.hotelRoom.update({
      where: { id: booking.roomId },
      data: { currentOccupancy: { decrement: 1 } },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "HotelBooking",
    entityId: bookingId,
    changes: {
      status: { old: booking.status, new: "CANCELLED" },
      reason: { old: null, new: reason },
    },
  });

  return { success: true, data: undefined };
}

export async function checkInHotel(bookingId: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "KASIR") {
    return { success: false, error: { message: "Hanya Kasir yang bisa melakukan check-in", code: "FORBIDDEN" } };
  }

  const booking = await client.hotelBooking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!booking) {
    return { success: false, error: { message: "Booking tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (booking.status !== "CONFIRMED") {
    return { success: false, error: { message: "Hanya booking CONFIRMED yang bisa check-in", code: "BUSINESS_RULE" } };
  }

  await client.$transaction([
    client.hotelBooking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_IN" },
    }),
    client.hotelRoom.update({
      where: { id: booking.roomId },
      data: { status: "OCCUPIED" },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "HotelBooking",
    entityId: bookingId,
    changes: {
      status: { old: booking.status, new: "CHECKED_IN" },
    },
  });

  return { success: true, data: undefined };
}

export async function checkOutHotel(bookingId: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (role !== "KASIR") {
    return { success: false, error: { message: "Hanya Kasir yang bisa melakukan check-out", code: "FORBIDDEN" } };
  }

  const booking = await client.hotelBooking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!booking) {
    return { success: false, error: { message: "Booking tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (booking.status !== "CHECKED_IN") {
    return { success: false, error: { message: "Hanya booking CHECKED_IN yang bisa check-out", code: "BUSINESS_RULE" } };
  }

  await client.$transaction([
    client.hotelBooking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_OUT" },
    }),
    client.hotelRoom.update({
      where: { id: booking.roomId },
      data: { currentOccupancy: { decrement: 1 }, status: "AVAILABLE" },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "HotelBooking",
    entityId: bookingId,
    changes: {
      status: { old: booking.status, new: "CHECKED_OUT" },
    },
  });

  return { success: true, data: undefined };
}

export async function addBookingService(
  bookingId: string,
  serviceType: string,
  quantity: number,
  unitPrice: number,
  notes?: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const booking = await client.hotelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, error: { message: "Booking tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (booking.status === "CHECKED_OUT" || booking.status === "CANCELLED") {
    return { success: false, error: { message: "Tidak bisa menambah layanan pada booking yang sudah selesai atau dibatalkan", code: "BUSINESS_RULE" } };
  }

  const subtotal = quantity * unitPrice;

  const service = await client.hotelBookingService.create({
    data: {
      bookingId,
      serviceType,
      quantity,
      unitPrice,
      subtotal,
      notes,
    },
  });

  const allServices = await client.hotelBookingService.findMany({
    where: { bookingId },
  });
  const totalServiceFee = allServices.reduce((sum, s) => sum + Number(s.subtotal), 0);

  const newTotal = Number(booking.subtotal) + totalServiceFee - Number(booking.discountAmount);

  await client.hotelBooking.update({
    where: { id: bookingId },
    data: { serviceFee: totalServiceFee, total: newTotal },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "HotelBookingService",
    entityId: service.id,
    changes: {
      serviceType: { old: null, new: serviceType },
      quantity: { old: null, new: quantity },
      unitPrice: { old: null, new: unitPrice },
    },
  });

  return { success: true, data: service.id };
}

export async function getAvailableRooms(
  checkInDate: string,
  checkOutDate: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResult<any[]>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const ci = new Date(checkInDate);
  const co = new Date(checkOutDate);

  const bookedRoomIds = await client.hotelBooking.findMany({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      checkInDate: { lt: co },
      checkOutDate: { gt: ci },
    },
    select: { roomId: true },
  });

  const occupiedIds = bookedRoomIds.map((b) => b.roomId);

  const rooms = await client.hotelRoom.findMany({
    where: {
      status: { not: "MAINTENANCE" },
      id: { notIn: occupiedIds },
    },
    orderBy: { roomNumber: "asc" },
  });

  return { success: true, data: rooms };
}

export async function getHotelOccupancy(
  dateFrom?: string,
  dateTo?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const totalRooms = await client.hotelRoom.count({
    where: { status: { not: "MAINTENANCE" } },
  });

  const from = dateFrom ? new Date(dateFrom) : new Date();
  const to = dateTo ? new Date(dateTo) : new Date();

  const occupiedBookings = await client.hotelBooking.findMany({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      checkInDate: { lt: to },
      checkOutDate: { gt: from },
    },
    select: { roomId: true },
  });

  const occupiedRoomIds = new Set(occupiedBookings.map((b) => b.roomId));
  const occupiedRooms = occupiedRoomIds.size;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  const revenueBookings = await client.hotelBooking.findMany({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
      checkInDate: { gte: from },
      checkOutDate: { lte: to },
    },
    select: { total: true },
  });

  const revenue = revenueBookings.reduce((sum, b) => sum + Number(b.total), 0);

  return {
    success: true,
    data: {
      totalRooms,
      occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      revenue,
    },
  };
}

export async function getHotelRevenue(
  dateFrom?: string,
  dateTo?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as { id: string; role: string }).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(1));
  const to = dateTo ? new Date(dateTo) : new Date();

  const bookings = await client.hotelBooking.findMany({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
      checkInDate: { gte: from },
      checkOutDate: { lte: to },
    },
    include: { room: { select: { type: true, dailyRate: true } } },
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total), 0);

  const byRoomType: Record<string, number> = {};
  for (const booking of bookings) {
    const type = booking.room.type;
    byRoomType[type] = (byRoomType[type] || 0) + Number(booking.total);
  }

  const totalDays = bookings.reduce((sum, b) => sum + b.totalDays, 0);
  const totalDailyRates = bookings.reduce((sum, b) => sum + Number(b.dailyRate), 0);
  const avgDailyRate = bookings.length > 0 ? totalDailyRates / bookings.length : 0;

  return {
    success: true,
    data: {
      totalRevenue,
      byRoomType,
      avgDailyRate: Math.round(avgDailyRate * 100) / 100,
    },
  };
}
