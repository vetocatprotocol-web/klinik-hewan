"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAuditLogs } from "@/server/actions/queries";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface AuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  ipAddress: string | null;
  createdAt: Date | string;
  user: { id: string; name: string; email: string } | null;
}

const ACTION_OPTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "ARCHIVE", label: "Archive" },
  { value: "PAYMENT", label: "Payment" },
  { value: "STATUS_CHANGE", label: "Status Change" },
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<AuditLogRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAuditLogs({
        page,
        action: action || undefined,
        entityType: entityType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(result.data as AuditLogRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, action, entityType, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [action, entityType, dateFrom, dateTo]);

  const formatChanges = (changes: any) => {
    if (!changes) return "-";
    if (typeof changes === "string") return changes;
    try {
      const entries = Object.entries(changes);
      if (entries.length === 0) return "-";
      return entries
        .map(([key, value]) => {
          const val = typeof value === "object" ? JSON.stringify(value) : String(value);
          return `${key}: ${val}`;
        })
        .join(", ");
    } catch {
      return JSON.stringify(changes);
    }
  };

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      id: "createdAt",
      header: "Tanggal",
      renderCell: (row) =>
        new Date(row.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      id: "user",
      header: "User",
      renderCell: (row) => row.user?.name || "-",
    },
    {
      id: "action",
      header: "Aksi",
      renderCell: (row) => {
        const opt = ACTION_OPTIONS.find((o) => o.value === row.action);
        return opt?.label || row.action;
      },
    },
    {
      id: "entityType",
      header: "Entity",
    },
    {
      id: "entityId",
      header: "Entity ID",
      renderCell: (row) => (
        <span className="font-mono text-xs">{row.entityId.slice(0, 8)}...</span>
      ),
    },
    {
      id: "changes",
      header: "Changes",
      renderCell: (row) => (
        <span className="max-w-xs truncate text-sm" title={formatChanges(row.changes)}>
          {formatChanges(row.changes)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Riwayat aktivitas sistem
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTableToolbar>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer">Customer</SelectItem>
                <SelectItem value="Visit">Visit</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Drug">Drug</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="PosOrder">Pos Order</SelectItem>
                <SelectItem value="StockAdjustment">Stock Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="sr-only">Dari</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="sr-only">Sampai</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
          </DataTableToolbar>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada audit log"
        emptyDescription="Audit log akan muncul di sini"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
