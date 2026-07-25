import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    visit: {
      findUnique: vi.fn(),
    },
    prescription: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
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

vi.mock("@/lib/utils", () => ({
  generatePrescriptionNumber: vi.fn(() => "RX-2026-0725-00001"),
}));

import {
  generatePrescription,
  completePrescription,
  cancelPrescription,
} from "@/server/actions/prescriptions";
import prisma from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe("Prescription Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generatePrescription", () => {
    it("should generate a prescription from a completed visit with drug items", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.visit.findUnique as any).mockResolvedValue({
        id: "visit-1",
        status: "COMPLETED",
        customerId: "cust-1",
        petId: "pet-1",
        prescription: null,
        visitItems: [
          {
            itemType: "DRUG",
            drugId: "drug-1",
            quantity: 2,
            dosage: "500mg",
            durationDays: 7,
            instructions: "3x sehari",
          },
          { itemType: "SERVICE", drugId: null, quantity: 1 },
        ],
      });

      (mockPrisma.prescription.create as any).mockResolvedValue({
        id: "rx-1",
        prescriptionNumber: "RX-2026-0725-00001",
      });

      const result = await generatePrescription("visit-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("rx-1");
      }
      expect(mockPrisma.prescription.create).toHaveBeenCalledOnce();
    });

    it("should return error when visit is not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.visit.findUnique as any).mockResolvedValue(null);

      const result = await generatePrescription("visit-missing");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });

    it("should return error when visit is not completed", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.visit.findUnique as any).mockResolvedValue({
        id: "visit-1",
        status: "DRAFT",
        prescription: null,
        visitItems: [],
      });

      const result = await generatePrescription("visit-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });

    it("should return error when visit already has a prescription", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.visit.findUnique as any).mockResolvedValue({
        id: "visit-1",
        status: "COMPLETED",
        prescription: { id: "existing-rx" },
        visitItems: [{ itemType: "DRUG", drugId: "drug-1", quantity: 1 }],
      });

      const result = await generatePrescription("visit-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });
  });

  describe("completePrescription", () => {
    it("should complete an active prescription", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.prescription.findUnique as any).mockResolvedValue({
        id: "rx-1",
        status: "ACTIVE",
      });

      (mockPrisma.prescription.update as any).mockResolvedValue({});

      const result = await completePrescription("rx-1");

      expect(result.success).toBe(true);
      expect(mockPrisma.prescription.update).toHaveBeenCalledWith({
        where: { id: "rx-1" },
        data: { status: "COMPLETED" },
      });
    });

    it("should return error when prescription is already completed", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.prescription.findUnique as any).mockResolvedValue({
        id: "rx-1",
        status: "COMPLETED",
      });

      const result = await completePrescription("rx-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });
  });

  describe("cancelPrescription", () => {
    it("should cancel an active prescription", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.prescription.findUnique as any).mockResolvedValue({
        id: "rx-1",
        status: "ACTIVE",
      });

      (mockPrisma.prescription.update as any).mockResolvedValue({});

      const result = await cancelPrescription("rx-1", "Tidak jadi");

      expect(result.success).toBe(true);
      expect(mockPrisma.prescription.update).toHaveBeenCalledWith({
        where: { id: "rx-1" },
        data: { status: "CANCELLED" },
      });
    });

    it("should return error when prescription is already cancelled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.prescription.findUnique as any).mockResolvedValue({
        id: "rx-1",
        status: "CANCELLED",
      });

      const result = await cancelPrescription("rx-1", "Alasan");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });
  });
});
