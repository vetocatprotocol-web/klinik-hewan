"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchVisits } from "@/server/actions/queries";
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
import { cn, formatDate } from "@/lib/utils";
import { VISIT_STATUSES } from "@/lib/constants";

interface VisitRow {
  id: string;
  visitNumber: string;
  visitDate: string;
  diagnosis: string;
  status: string;
  customer: { id: string; name: string; phone: string };
  pet: { id: string; name: string; species: string };
}

export default function VisitsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<VisitRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchVisits({
        page,
        search,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(result.data as unknown as VisitRow[]);
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

  const columns: ColumnDef<VisitRow>[] = [
    {
      id: "visitNumber",
      header: "No. Kunjungan",
      renderCell: (row) => (
        <Link
          href={`/visits/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.visitNumber}
        </Link>
      ),
    },
    {
      id: "visitDate",
      header: "Tanggal",
      renderCell: (row) => formatDate(row.visitDate),
    },
    {
      id: "customer",
      header: "Pelanggan",
      renderCell: (row) => row.customer.name,
    },
    {
      id: "pet",
      header: "Hewan",
      renderCell: (row) => `${row.pet.name} (${row.pet.species})`,
    },
    {
      id: "diagnosis",
      header: "Diagnosis",
      renderCell: (row) => (
        <span className="line-clamp-1 max-w-[200px]">{row.diagnosis}</span>
      ),
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
            href={`/visits/${row.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Lihat
          </Link>
          {row.status === "DRAFT" && (
            <Link
              href={`/visits/${row.id}/edit`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Ubah
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunjungan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data kunjungan klinik
          </p>
        </div>
        <Link href="/visits/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Kunjungan Baru
        </Link>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nomor, pelanggan, atau diagnosis..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {VISIT_STATUSES.map((s) => (
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
        emptyTitle="Belum ada kunjungan"
        emptyDescription="Buat kunjungan baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
