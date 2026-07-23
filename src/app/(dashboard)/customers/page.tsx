"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCustomers } from "@/server/queries/customers";
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
import { cn } from "@/lib/utils";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
  pets: { id: string }[];
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CustomerRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCustomers({ page, search, status: status || undefined });
      setData(result.data as unknown as CustomerRow[]);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
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

  const columns: ColumnDef<CustomerRow>[] = [
    {
      id: "name",
      header: "Nama",
      accessorKey: "name",
      renderCell: (row) => (
        <Link
          href={`/customers/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      id: "phone",
      header: "Telepon",
      accessorKey: "phone",
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
    },
    {
      id: "pets",
      header: "Hewan",
      renderCell: (row) => (
        <span className="text-muted-foreground">{row.pets.length}</span>
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
            href={`/customers/${row.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Lihat
          </Link>
          <Link
            href={`/customers/${row.id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Ubah
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pelanggan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data pelanggan klinik
          </p>
        </div>
        <Link href="/customers/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pelanggan
        </Link>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nama, telepon, atau email..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada pelanggan"
        emptyDescription="Tambahkan pelanggan baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
