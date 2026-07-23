"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getInvoices } from "@/server/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUSES } from "@/lib/constants";
import { toNumber } from "@/types";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customer: { id: string; name: string; phone: string };
  pet: { id: string; name: string } | null;
  invoiceDate: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  status: string;
}

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInvoices({
        page,
        search,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(result.data as unknown as InvoiceRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, status, dateFrom, dateTo]);

  const columns: ColumnDef<InvoiceRow>[] = [
    {
      id: "invoiceNumber",
      header: "No. Invoice",
      accessorKey: "invoiceNumber",
      renderCell: (row) => (
        <Link
          href={`/invoices/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.invoiceNumber}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Pelanggan",
      renderCell: (row) => (
        <div>
          <p className="font-medium">{row.customer.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.pet?.name || "-"}
          </p>
        </div>
      ),
    },
    {
      id: "invoiceDate",
      header: "Tanggal",
      renderCell: (row) => formatDate(row.invoiceDate),
    },
    {
      id: "total",
      header: "Total",
      renderCell: (row) => formatCurrency(toNumber(row.total)),
    },
    {
      id: "paidAmount",
      header: "Dibayar",
      renderCell: (row) => formatCurrency(toNumber(row.paidAmount)),
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
            href={`/invoices/${row.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <Eye className="mr-1 h-3 w-3" />
            Lihat
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Daftar invoice pelanggan
        </p>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nomor invoice atau nama pelanggan..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[160px]"
          placeholder="Dari tanggal"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[160px]"
          placeholder="Sampai tanggal"
        />
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada invoice"
        emptyDescription="Invoice akan muncul setelah pembuatan billing"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
