import { Decimal } from "@prisma/client/runtime/client";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: { message: string; field?: string; code?: string } };

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

export interface DashboardStats {
  todayVisits: number;
  todayRevenue: number;
  pendingPayments: number;
  lowStockProducts: number;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface DecimalLike {
  valueOf(): string;
}

export function toNumber(val: number | Decimal | DecimalLike | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return parseFloat(String(val));
}
