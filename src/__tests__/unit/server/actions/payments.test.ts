import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    invoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    visit: {
      update: vi.fn(),
    },
    billing: {
      update: vi.fn(),
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

vi.mock("@/server/lib/email", () => ({
  sendEmail: vi.fn(),
  generatePaymentConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  generatePaymentNumber: vi.fn(() => "PAY-2026-0724-00001"),
}));

import { processPayment } from "@/server/actions/payments";
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

describe("Payment Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processPayment", () => {
    it("should process full payment successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "cashier-1", role: "KASIR" },
      } as any);

      (mockPrisma.invoice.findUnique as any).mockResolvedValue({
        id: "inv-1",
        invoiceNumber: "INV-2026-0724-00001",
        status: "UNPAID",
        total: 176000,
        paidAmount: 0,
        sourceType: "VISIT",
        sourceId: "visit-1",
        customerId: "cust-1",
        customer: { id: "cust-1", name: "John", email: "john@test.com", userId: "user-cust" },
      });

      (mockPrisma.$transaction as any).mockImplementation(async (fn: Function) => {
        const tx = {
          payment: {
            create: vi.fn().mockResolvedValue({ id: "pay-1" }),
          },
          invoice: {
            update: vi.fn().mockResolvedValue({ id: "inv-1" }),
          },
          visit: {
            update: vi.fn().mockResolvedValue({ id: "visit-1" }),
          },
          billing: {
            update: vi.fn().mockResolvedValue({ id: "billing-1" }),
          },
        };
        return fn(tx);
      });

      const formData = createFormData({
        invoiceId: "inv-1",
        paymentMethod: "CASH",
        amount: "176000",
      });

      const result = await processPayment(null, formData);

      expect(result.success).toBe(true);
    });

    it("should reject payment on already paid invoice", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "cashier-1", role: "KASIR" },
      } as any);

      (mockPrisma.invoice.findUnique as any).mockResolvedValue({
        id: "inv-1",
        status: "PAID",
        total: 176000,
        paidAmount: 176000,
        customer: { id: "cust-1", name: "John", email: "john@test.com", userId: "user-cust" },
      });

      const formData = createFormData({
        invoiceId: "inv-1",
        paymentMethod: "CASH",
        amount: "176000",
      });

      const result = await processPayment(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });

    it("should reject payment exceeding remaining balance", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "cashier-1", role: "KASIR" },
      } as any);

      (mockPrisma.invoice.findUnique as any).mockResolvedValue({
        id: "inv-1",
        status: "UNPAID",
        total: 176000,
        paidAmount: 0,
        customer: { id: "cust-1", name: "John", email: "john@test.com", userId: "user-cust" },
      });

      const formData = createFormData({
        invoiceId: "inv-1",
        paymentMethod: "CASH",
        amount: "200000",
      });

      const result = await processPayment(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_PAYMENT");
      }
    });

    it("should reject unauthorized users", async () => {
      mockAuth.mockResolvedValue(null as any);

      const formData = createFormData({
        invoiceId: "inv-1",
        paymentMethod: "CASH",
        amount: "100000",
      });

      const result = await processPayment(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
