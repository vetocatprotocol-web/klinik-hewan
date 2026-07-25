import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    appointment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    pet: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    doctorSchedule: {
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
  generateAppointmentNumber: vi.fn(() => "APT-2026-0725-00001"),
}));

import {
  createAppointment,
  completeAppointment,
  cancelAppointment,
  getAvailableSlots,
} from "@/server/actions/appointments";
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

describe("Appointment Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAppointment", () => {
    it("should create an appointment successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.customer.findUnique as any).mockResolvedValue({
        id: "cust-1",
        status: "ACTIVE",
      });
      (mockPrisma.pet.findUnique as any).mockResolvedValue({
        id: "pet-1",
        customerId: "cust-1",
        status: "ACTIVE",
      });
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "doc-1",
        role: "DOKTER",
        status: "ACTIVE",
      });
      (mockPrisma.doctorSchedule.findUnique as any).mockResolvedValue({
        doctorId: "doc-1",
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "12:00",
        slotDuration: 30,
        status: "ACTIVE",
      });
      (mockPrisma.appointment.findFirst as any).mockResolvedValue(null);
      (mockPrisma.appointment.create as any).mockResolvedValue({
        id: "apt-1",
        appointmentNumber: "APT-2026-0725-00001",
      });

      const fd = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        doctorId: "doc-1",
        appointmentDate: "2026-07-28",
        time: "09:00",
      });

      const result = await createAppointment(null, fd);
      expect(result.success).toBe(true);
      expect(result.data).toBe("apt-1");
    });

    it("should return error when slot is already booked", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.customer.findUnique as any).mockResolvedValue({
        id: "cust-1",
        status: "ACTIVE",
      });
      (mockPrisma.pet.findUnique as any).mockResolvedValue({
        id: "pet-1",
        customerId: "cust-1",
        status: "ACTIVE",
      });
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "doc-1",
        role: "DOKTER",
        status: "ACTIVE",
      });
      (mockPrisma.doctorSchedule.findUnique as any).mockResolvedValue({
        doctorId: "doc-1",
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "12:00",
        slotDuration: 30,
        status: "ACTIVE",
      });
      (mockPrisma.appointment.findFirst as any).mockResolvedValue({
        id: "existing-apt",
        time: "09:00",
      });

      const fd = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        doctorId: "doc-1",
        appointmentDate: "2026-07-28",
        time: "09:00",
      });

      const result = await createAppointment(null, fd);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("BUSINESS_RULE");
    });

    it("should return error when user is unauthorized", async () => {
      mockAuth.mockResolvedValue(null as any);

      const fd = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        doctorId: "doc-1",
        appointmentDate: "2026-07-28",
        time: "09:00",
      });

      const result = await createAppointment(null, fd);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNAUTHORIZED");
    });
  });

  describe("completeAppointment", () => {
    it("should complete a confirmed appointment", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doc-1", role: "DOKTER" },
      } as any);

      (mockPrisma.appointment.findUnique as any).mockResolvedValue({
        id: "apt-1",
        status: "CONFIRMED",
        appointmentNumber: "APT-001",
        customer: { userId: "user-1", name: "Budi" },
        pet: { name: "Kucing" },
      });
      (mockPrisma.appointment.update as any).mockResolvedValue({});

      const result = await completeAppointment("apt-1");
      expect(result.success).toBe(true);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "apt-1" },
        data: { status: "COMPLETED" },
      });
    });

    it("should return error when appointment is not CONFIRMED", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doc-1", role: "DOKTER" },
      } as any);

      (mockPrisma.appointment.findUnique as any).mockResolvedValue({
        id: "apt-1",
        status: "PENDING",
        appointmentNumber: "APT-001",
        customer: { userId: "user-1", name: "Budi" },
        pet: { name: "Kucing" },
      });

      const result = await completeAppointment("apt-1");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("BUSINESS_RULE");
    });
  });

  describe("cancelAppointment", () => {
    it("should cancel a pending appointment", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.appointment.findUnique as any).mockResolvedValue({
        id: "apt-1",
        status: "PENDING",
        appointmentNumber: "APT-001",
        notes: null,
        customer: { userId: "user-1", name: "Budi" },
        pet: { name: "Kucing" },
      });
      (mockPrisma.appointment.update as any).mockResolvedValue({});

      const result = await cancelAppointment("apt-1", "Tidak jadi");
      expect(result.success).toBe(true);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "apt-1" },
        data: { status: "CANCELLED", notes: "Tidak jadi" },
      });
    });

    it("should return error when appointment is already cancelled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.appointment.findUnique as any).mockResolvedValue({
        id: "apt-1",
        status: "CANCELLED",
        appointmentNumber: "APT-001",
        customer: { userId: "user-1", name: "Budi" },
        pet: { name: "Kucing" },
      });

      const result = await cancelAppointment("apt-1");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("BUSINESS_RULE");
    });
  });

  describe("getAvailableSlots", () => {
    it("should return available time slots", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "KASIR" },
      } as any);

      (mockPrisma.doctorSchedule.findUnique as any).mockResolvedValue({
        doctorId: "doc-1",
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "10:00",
        slotDuration: 30,
        status: "ACTIVE",
      });
      (mockPrisma.appointment.findMany as any).mockResolvedValue([
        { time: "09:00" },
      ]);

      const result = await getAvailableSlots("doc-1", "2026-07-28");
      expect(result.success).toBe(true);
      expect(result.data).toContain("09:30");
      expect(result.data).not.toContain("09:00");
    });

    it("should return error when doctor has no schedule for the day", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "KASIR" },
      } as any);

      (mockPrisma.doctorSchedule.findUnique as any).mockResolvedValue(null);

      const result = await getAvailableSlots("doc-1", "2026-07-28");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });
});
