"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listSuppliers } from "@/server/actions/suppliers";
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

interface SupplierRow {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: string;
  _count: { purchaseOrders: number };
}

const SUPPLIER_STATUSES = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Nonaktif" },
  { value: "BLACKLIST", label: "Blacklist" },
];

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SupplierRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSuppliers({
        page,
        search,
        status: status || undefined,
      });
      setData(result.data as unknown as SupplierRow[]);
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

  const columns: ColumnDef<SupplierRow>[] = [
    {
      id: "name",
      header: "Nama",
      accessorKey: "name",
      renderCell: (row) => (
        <Link
          href={`/suppliers/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      id: "contactPerson",
      header: "Kontak",
      accessorKey: "contactPerson",
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
      id: "city",
      header: "Kota",
      accessorKey: "city",
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
            href={`/suppliers/${row.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Lihat
          </Link>
          <Link
            href={`/suppliers/${row.id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data supplier klinik
          </p>
        </div>
        <Link href="/suppliers/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Supplier
        </Link>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nama supplier..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {SUPPLIER_STATUSES.map((s) => (
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
        emptyTitle="Belum ada supplier"
        emptyDescription="Tambahkan supplier baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
