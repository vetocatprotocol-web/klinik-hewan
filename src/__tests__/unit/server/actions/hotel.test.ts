import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    hotelBooking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    hotelRoom: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    hotelBookingService: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    default: mockClient,
    prisma: vi.fn(async () => mockClient),
  };
});

vi.mock("@/server/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/server/lib/audit", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("@/server/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  generateBookingNumber: vi.fn(() => "HBK-2026-0725-00001"),
}));

import {
  createHotelBooking,
  checkInHotel,
  checkOutHotel,
} from "@/server/actions/hotel";
import prisma from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

describe("Hotel Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createHotelBooking", () => {
    it("should create a hotel booking successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.hotelRoom.findUnique as any).mockResolvedValue({
        id: "room-1",
        roomNumber: "101",
        dailyRate: 150000,
        status: "AVAILABLE",
      });
      (mockPrisma.hotelBooking.findFirst as any).mockResolvedValue(null);
      (mockPrisma.hotelBooking.create as any).mockResolvedValue({
        id: "booking-1",
        bookingNumber: "HBK-2026-0725-00001",
      });
      (mockPrisma.hotelRoom.update as any).mockResolvedValue({});
      (mockPrisma.customer.findUnique as any).mockResolvedValue(null);

      const fd = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        roomId: "room-1",
        checkInDate: "2026-07-28",
        checkOutDate: "2026-07-30",
        serviceFee: "50000",
        discountAmount: "0",
      });

      const result = await createHotelBooking(null, fd);
      expect(result.success).toBe(true);
      expect((result as any).data).toBe("booking-1");
    });

    it("should return error when room is not available", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.hotelRoom.findUnique as any).mockResolvedValue({
        id: "room-1",
        roomNumber: "101",
        dailyRate: 150000,
        status: "OCCUPIED",
      });

      const fd = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        roomId: "room-1",
        checkInDate: "2026-07-28",
        checkOutDate: "2026-07-30",
      });

      const result = await createHotelBooking(null, fd);
      expect(result.success).toBe(false);
      expect((result as any).error?.code).toBe("BUSINESS_RULE");
    });

    it("should return error when required fields are missing", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      const fd = createFormData({
        customerId: "cust-1",
      });

      const result = await createHotelBooking(null, fd);
      expect(result.success).toBe(false);
      expect((result as any).error?.code).toBe("VALIDATION");
    });
  });

  describe("checkInHotel", () => {
    it("should check in a confirmed booking", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.hotelBooking.findUnique as any).mockResolvedValue({
        id: "booking-1",
        status: "CONFIRMED",
        roomId: "room-1",
        room: { id: "room-1", status: "AVAILABLE" },
      });
      (mockPrisma.$transaction as any).mockResolvedValue([{}, {}]);

      const result = await checkInHotel("booking-1");
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return error when booking is not CONFIRMED", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.hotelBooking.findUnique as any).mockResolvedValue({
        id: "booking-1",
        status: "CHECKED_IN",
        roomId: "room-1",
        room: { id: "room-1", status: "OCCUPIED" },
      });

      const result = await checkInHotel("booking-1");
      expect(result.success).toBe(false);
      expect((result as any).error?.code).toBe("BUSINESS_RULE");
    });
  });

  describe("checkOutHotel", () => {
    it("should check out a checked-in booking", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.hotelBooking.findUnique as any).mockResolvedValue({
        id: "booking-1",
        status: "CHECKED_IN",
        roomId: "room-1",
        room: { id: "room-1", status: "OCCUPIED" },
      });
      (mockPrisma.$transaction as any).mockResolvedValue([{}, {}]);

      const result = await checkOutHotel("booking-1");
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return error when booking is not CHECKED_IN", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.hotelBooking.findUnique as any).mockResolvedValue({
        id: "booking-1",
        status: "CONFIRMED",
        roomId: "room-1",
        room: { id: "room-1", status: "AVAILABLE" },
      });

      const result = await checkOutHotel("booking-1");
      expect(result.success).toBe(false);
      expect((result as any).error?.code).toBe("BUSINESS_RULE");
    });
  });
});
