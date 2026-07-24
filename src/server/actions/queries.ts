"use server";

import { auth } from "../lib/auth";
import {
  getServices, getActiveServices, getDrugs, getActiveDrugs,
  getProducts, getActiveProducts, getProductCategories,
  getInvoices, getInvoiceById, getBillings, getBillingById,
  getPosOrders, getUsers, getRoles, getSettings,
  getNotifications, getStockAdjustments, getDashboardStats, getRecentTransactions,
  getAuditLogs,
} from "@/server/queries";
import { getCustomers, getCustomerById, searchCustomers } from "@/server/queries/customers";
import { getVisits, getVisitById } from "@/server/queries/visits";

const STAFF_ROLES = ["OWNER", "DOKTER", "KASIR", "ADMIN"];

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

async function requireStaff() {
  const session = await requireAuth();
  const role = (session.user as any).role;
  if (!STAFF_ROLES.includes(role)) throw new Error("FORBIDDEN");
  return session;
}

async function requireOwner() {
  const session = await requireAuth();
  const role = (session.user as any).role;
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function fetchServices(params: Parameters<typeof getServices>[0]) { await requireStaff(); return getServices(params); }
export async function fetchActiveServices() { return getActiveServices(); }
export async function fetchDrugs(params: Parameters<typeof getDrugs>[0]) { await requireStaff(); return getDrugs(params); }
export async function fetchActiveDrugs() { return getActiveDrugs(); }
export async function fetchProducts(params: Parameters<typeof getProducts>[0]) { await requireStaff(); return getProducts(params); }
export async function fetchActiveProducts() { return getActiveProducts(); }
export async function fetchProductCategories() { return getProductCategories(); }
export async function fetchInvoices(params: Parameters<typeof getInvoices>[0]) { await requireStaff(); return getInvoices(params); }
export async function fetchInvoiceById(id: string) { await requireStaff(); return getInvoiceById(id); }
export async function fetchBillings(params: Parameters<typeof getBillings>[0]) { await requireStaff(); return getBillings(params); }
export async function fetchBillingById(id: string) { await requireStaff(); return getBillingById(id); }
export async function fetchPosOrders(params: Parameters<typeof getPosOrders>[0]) { await requireStaff(); return getPosOrders(params); }
export async function fetchUsers(params: Parameters<typeof getUsers>[0]) { await requireOwner(); return getUsers(params); }
export async function fetchRoles() { await requireOwner(); return getRoles(); }
export async function fetchSettings() { await requireStaff(); return getSettings(); }
export async function fetchNotifications(userId: string) {
  const session = await requireAuth();
  const sessionUserId = (session.user as any).id;
  const role = (session.user as any).role;
  // Staff can fetch any notifications, customers can only fetch their own
  const staffRoles = ["OWNER", "DOKTER", "KASIR", "ADMIN"];
  if (!staffRoles.includes(role) && userId !== sessionUserId) {
    throw new Error("FORBIDDEN");
  }
  return getNotifications(userId);
}
export async function fetchStockAdjustments(params: Parameters<typeof getStockAdjustments>[0]) { await requireStaff(); return getStockAdjustments(params); }
export async function fetchDashboardStats() { await requireStaff(); return getDashboardStats(); }
export async function fetchRecentTransactions() { await requireStaff(); return getRecentTransactions(); }
export async function fetchCustomers(params: Parameters<typeof getCustomers>[0]) { await requireStaff(); return getCustomers(params); }
export async function fetchCustomerById(id: string) { await requireStaff(); return getCustomerById(id); }
export async function fetchSearchCustomers(query: string) { await requireStaff(); return searchCustomers(query); }
export async function fetchVisits(params: Parameters<typeof getVisits>[0]) { await requireStaff(); return getVisits(params); }
export async function fetchVisitById(id: string) { await requireStaff(); return getVisitById(id); }
export async function fetchAuditLogs(params: Parameters<typeof getAuditLogs>[0]) { await requireOwner(); return getAuditLogs(params); }
