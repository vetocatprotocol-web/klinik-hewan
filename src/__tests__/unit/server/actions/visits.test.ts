import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    visit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    visitItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    pet: {
      findUnique: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
    },
    drug: {
      findMany: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
    },
    invoiceItem: {
      create: vi.fn(),
    },
    prescription: {
      create: vi.fn(),
    },
    prescriptionItem: {
      create: vi.fn(),
    },
    setting: {
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
  generateVisitNumber: vi.fn(() => "VIS-2026-0724-00001"),
  generateInvoiceNumber: vi.fn(() => "INV-2026-0724-00001"),
  generatePrescriptionNumber: vi.fn(() => "RX-2026-0724-00001"),
}));

import { createVisit, completeVisit } from "@/server/actions/visits";
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

describe("Visit Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createVisit", () => {
    it("should create a visit with items", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
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

      (mockPrisma.service.findMany as any).mockResolvedValue([
        { id: "svc-1", name: "Konsultasi", price: 150000, status: "ACTIVE" },
      ]);

      (mockPrisma.drug.findMany as any).mockResolvedValue([
        { id: "drug-1", name: "Amoxicillin", pricePerUnit: 5000, status: "ACTIVE" },
      ]);

      (mockPrisma.visit.create as any).mockResolvedValue({
        id: "visit-1",
        visitNumber: "VIS-2026-0724-00001",
      });

      (mockPrisma.visitItem.create as any).mockResolvedValue({});

      const formData = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        visitDate: "2026-07-24",
        chiefComplaint: "Demam",
        diagnosis: "Infeksi",
        services: JSON.stringify([{ serviceId: "svc-1", quantity: 1 }]),
        drugs: JSON.stringify([{ drugId: "drug-1", quantity: 2 }]),
      });

      const result = await createVisit(null, formData);

      expect(result.success).toBe(true);
    });

    it("should reject non-DOKTER users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "KASIR" },
      } as any);

      const formData = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        visitDate: "2026-07-24",
        chiefComplaint: "Demam",
        diagnosis: "Infeksi",
        services: JSON.stringify([{ serviceId: "svc-1", quantity: 1 }]),
      });

      const result = await createVisit(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("FORBIDDEN");
      }
    });

    it("should reject unauthorized users", async () => {
      mockAuth.mockResolvedValue(null as any);

      const formData = createFormData({
        customerId: "cust-1",
        petId: "pet-1",
        visitDate: "2026-07-24",
        chiefComplaint: "Demam",
        diagnosis: "Infeksi",
      });

      const result = await createVisit(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("completeVisit", () => {
    it("should complete visit and generate invoice", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.visit.findUnique as any).mockResolvedValue({
        id: "visit-1",
        status: "DRAFT",
        customerId: "cust-1",
        petId: "pet-1",
        visitNumber: "VIS-2026-0724-00001",
        diagnosis: "Infeksi",
        subtotal: 160000,
        customer: { id: "cust-1", name: "John", email: "john@test.com", userId: "user-cust" },
        pet: { name: "Buddy" },
        visitItems: [
          { id: "item-1", itemType: "SERVICE", serviceId: "svc-1", drugId: null, quantity: 1, unitPrice: 150000, subtotal: 150000, dosage: null, durationDays: null, instructions: null },
          { id: "item-2", itemType: "DRUG", serviceId: null, drugId: "drug-1", quantity: 2, unitPrice: 5000, subtotal: 10000, dosage: null, durationDays: null, instructions: null },
        ],
      });

      (mockPrisma.setting.findUnique as any).mockResolvedValue({
        key: "tax_config",
        value: { type: "PERCENTAGE", value: 10, enabled: true },
      });

      (mockPrisma.$transaction as any).mockImplementation(async (fn: Function) => {
        const tx = {
          invoice: {
            create: vi.fn().mockResolvedValue({ id: "inv-1" }),
          },
          invoiceItem: {
            create: vi.fn(),
          },
          prescription: {
            create: vi.fn().mockResolvedValue({ id: "rx-1" }),
          },
          prescriptionItem: {
            create: vi.fn(),
          },
          visit: {
            update: vi.fn(),
          },
        };
        return fn(tx);
      });

      const result = await completeVisit("visit-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(typeof result.data).toBe("string");
      }
    });

    it("should reject completing non-DRAFT visit", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.visit.findUnique as any).mockResolvedValue({
        id: "visit-1",
        status: "COMPLETED",
        visitItems: [],
        customer: { id: "cust-1", name: "John", email: null, userId: null },
        pet: { name: "Buddy" },
      });

      const result = await completeVisit("visit-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });

    it("should reject visit with no items", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doctor-1", role: "DOKTER" },
      } as any);

      (mockPrisma.visit.findUnique as any).mockResolvedValue({
        id: "visit-1",
        status: "DRAFT",
        visitItems: [],
        customer: { id: "cust-1", name: "John", email: null, userId: null },
        pet: { name: "Buddy" },
      });

      const result = await completeVisit("visit-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });
  });
});
