"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SETTLED: "bg-green-100 text-green-800 border-green-200",
  UNPAID: "bg-red-100 text-red-800 border-red-200",
  PARTIAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  ARCHIVED: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  DRAFT: "Draft",
  COMPLETED: "Selesai",
  PAID: "Dibayar",
  OPEN: "Terbuka",
  SETTLED: "Lunas",
  UNPAID: "Belum Dibayar",
  PARTIAL: "Sebagian",
  PENDING: "Pending",
  FAILED: "Gagal",
  ARCHIVED: "Diarsipkan",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusColors[status] || "bg-gray-100 text-gray-800", className)}
    >
      {statusLabels[status] || status}
    </Badge>
  );
}
