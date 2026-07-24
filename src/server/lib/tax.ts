import prisma from "@/server/lib/prisma";

export interface TaxConfig {
  type: "FLAT" | "PERCENTAGE";
  value: number;
  enabled: boolean;
}

export async function getTaxConfig(): Promise<TaxConfig> {
  const setting = await prisma.setting.findUnique({
    where: { key: "tax_config" },
  });

  if (!setting) {
    return { type: "FLAT", value: 0, enabled: false };
  }

  const config = setting.value as Record<string, unknown>;
  return {
    type: (config.type as "FLAT" | "PERCENTAGE") || "FLAT",
    value: typeof config.value === "number" ? config.value : 0,
    enabled: typeof config.enabled === "boolean" ? config.enabled : false,
  };
}

export function calculateTax(subtotal: number, config: TaxConfig): number {
  if (!config.enabled || config.value <= 0) return 0;

  if (config.type === "FLAT") {
    return Math.round(config.value);
  }

  return Math.round(subtotal * (config.value / 100));
}

export function calculateTotalWithTax(subtotal: number, config: TaxConfig): number {
  const tax = calculateTax(subtotal, config);
  return subtotal + tax;
}

export function calculateChange(paymentAmount: number, total: number): number {
  if (paymentAmount <= total) return 0;
  return paymentAmount - total;
}
