"use server";

import {
  getServices, getActiveServices, getDrugs, getActiveDrugs,
  getProducts, getActiveProducts, getProductCategories,
  getInvoices, getInvoiceById, getBillings, getBillingById,
  getPosOrders, getUsers, getRoles, getSettings,
  getNotifications, getStockAdjustments, getDashboardStats, getRecentTransactions,
} from "@/server/queries";
import { getCustomers, getCustomerById, searchCustomers } from "@/server/queries/customers";
import { getVisits, getVisitById } from "@/server/queries/visits";

export async function fetchServices(params: Parameters<typeof getServices>[0]) { return getServices(params); }
export async function fetchActiveServices() { return getActiveServices(); }
export async function fetchDrugs(params: Parameters<typeof getDrugs>[0]) { return getDrugs(params); }
export async function fetchActiveDrugs() { return getActiveDrugs(); }
export async function fetchProducts(params: Parameters<typeof getProducts>[0]) { return getProducts(params); }
export async function fetchActiveProducts() { return getActiveProducts(); }
export async function fetchProductCategories() { return getProductCategories(); }
export async function fetchInvoices(params: Parameters<typeof getInvoices>[0]) { return getInvoices(params); }
export async function fetchInvoiceById(id: string) { return getInvoiceById(id); }
export async function fetchBillings(params: Parameters<typeof getBillings>[0]) { return getBillings(params); }
export async function fetchBillingById(id: string) { return getBillingById(id); }
export async function fetchPosOrders(params: Parameters<typeof getPosOrders>[0]) { return getPosOrders(params); }
export async function fetchUsers(params: Parameters<typeof getUsers>[0]) { return getUsers(params); }
export async function fetchRoles() { return getRoles(); }
export async function fetchSettings() { return getSettings(); }
export async function fetchNotifications(userId: string) { return getNotifications(userId); }
export async function fetchStockAdjustments(params: Parameters<typeof getStockAdjustments>[0]) { return getStockAdjustments(params); }
export async function fetchDashboardStats() { return getDashboardStats(); }
export async function fetchRecentTransactions() { return getRecentTransactions(); }
export async function fetchCustomers(params: Parameters<typeof getCustomers>[0]) { return getCustomers(params); }
export async function fetchCustomerById(id: string) { return getCustomerById(id); }
export async function fetchSearchCustomers(query: string) { return searchCustomers(query); }
export async function fetchVisits(params: Parameters<typeof getVisits>[0]) { return getVisits(params); }
export async function fetchVisitById(id: string) { return getVisitById(id); }
