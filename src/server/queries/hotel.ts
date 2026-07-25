import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getHotelRooms({
  page = 1,
  status,
  type,
}: {
  page?: number;
  status?: string;
  type?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    client.hotelRoom.findMany({
      where,
      orderBy: { roomNumber: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.hotelRoom.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getHotelBookings({
  page = 1,
  status,
  customerId,
}: {
  page?: number;
  status?: string;
  customerId?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [data, total] = await Promise.all([
    client.hotelBooking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { id: true, name: true, species: true } },
        room: { select: { id: true, roomNumber: true, name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.hotelBooking.count({ where }),
  ]);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getHotelBookingById(id: string) {
  const client = await prisma();
  return client.hotelBooking.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      room: true,
      services: true,
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function getHotelOccupancy({
  dateFrom,
  dateTo,
}: {
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const client = await prisma();
  const totalRooms = await client.hotelRoom.count({
    where: { status: { not: "MAINTENANCE" } },
  });

  const where: any = {
    status: { in: ["CONFIRMED", "CHECKED_IN"] },
  };

  if (dateFrom || dateTo) {
    where.checkInDate = {};
    if (dateFrom) where.checkInDate.gte = new Date(dateFrom);
    if (dateTo) where.checkInDate.lte = new Date(dateTo);
  }

  const activeBookings = await client.hotelBooking.count({ where });

  const rooms = await client.hotelRoom.findMany({
    where: { status: { not: "MAINTENANCE" } },
    select: { id: true, currentOccupancy: true, capacity: true },
  });

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupancy = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);

  return {
    totalRooms,
    totalCapacity,
    totalOccupancy,
    activeBookings,
    occupancyRate: totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0,
  };
}

export async function getHotelRevenue({
  dateFrom,
  dateTo,
}: {
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const client = await prisma();
  const where: any = {
    status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
  };

  if (dateFrom || dateTo) {
    where.checkInDate = {};
    if (dateFrom) where.checkInDate.gte = new Date(dateFrom);
    if (dateTo) where.checkInDate.lte = new Date(dateTo);
  }

  const bookings = await client.hotelBooking.findMany({
    where,
    select: { total: true, serviceFee: true, subtotal: true },
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total), 0);
  const roomRevenue = bookings.reduce((sum, b) => sum + Number(b.subtotal), 0);
  const serviceRevenue = bookings.reduce((sum, b) => sum + Number(b.serviceFee), 0);

  return {
    totalRevenue,
    roomRevenue,
    serviceRevenue,
    totalBookings: bookings.length,
  };
}
