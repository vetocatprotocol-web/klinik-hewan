import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function generateVisitNumber(date: Date): string {
  const d = date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `VIS-${year}-${month}${day}-${random}`;
}

export function generateInvoiceNumber(date: Date): string {
  const d = date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `INV-${year}-${month}${day}-${random}`;
}

export function generateBillingNumber(date: Date): string {
  const d = date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `BIL-${year}-${month}${day}-${random}`;
}

export function generatePaymentNumber(date: Date): string {
  const d = date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `PAY-${year}-${month}${day}-${random}`;
}

export function generateOrderNumber(date: Date): string {
  const d = date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `RCP-${year}-${month}${day}-${random}`;
}

export function generatePrescriptionNumber(date: Date): string {
  const d = date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `RX-${year}-${month}${day}-${random}`;
}

export function calculateAge(birthDate: Date | string): string {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();

  if (years > 0) {
    return months >= 0 ? `${years} tahun` : `${years - 1} tahun`;
  }
  return `${months >= 0 ? months : 12 + months} bulan`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
