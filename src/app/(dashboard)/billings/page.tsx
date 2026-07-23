"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getBillings } from "@/server/queries";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { BILLING_STATUSES } from "@/lib/constants";

interface BillingRow {
  id: string;
  billingNumber: string;
  billingStartDate: string;
  status: string;
  customer: { id: string; name: string; phone: string };
  pet: { id: string; name: string };
  billingItems: { id: string; subtotal: number }[];
}

export default function BillingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BillingRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBillings({
        page,
        search,
        status: status || undefined,
      });
      setData(result.data as unknown as BillingRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const columns: ColumnDef<BillingRow>[] = [
    {
      id: "billingNumber",
      header: "No. Billing",
      renderCell: (row) => (
        <Link
          href={`/billings/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.billingNumber}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Pelanggan",
      renderCell: (row) => row.customer.name,
    },
    {
      id: "pet",
      header: "Hewan",
      renderCell: (row) => row.pet.name,
    },
    {
      id: "billingStartDate",
      header: "Tanggal Mulai",
      renderCell: (row) => formatDate(row.billingStartDate),
    },
    {
      id: "itemsCount",
      header: "Jumlah Item",
      renderCell: (row) => row.billingItems.length,
    },
    {
      id: "total",
      header: "Total",
      renderCell: (row) =>
        formatCurrency(
          row.billingItems.reduce((sum, item) => sum + Number(item.subtotal), 0)
        ),
      className: "text-right",
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "Aksi",
      className: "text-right",
      renderCell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/billings/${row.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Lihat
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data billing klinik
          </p>
        </div>
        <Link href="/billings/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Billing Baru
        </Link>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nomor billing atau pelanggan..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {BILLING_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada billing"
        emptyDescription="Buat billing baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
