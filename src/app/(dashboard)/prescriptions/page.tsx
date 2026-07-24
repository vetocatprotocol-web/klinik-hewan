"use client";

import { useState, useEffect, useCallback } from "react";
import { getPrescriptions } from "@/server/actions/prescriptions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import Link from "next/link";

interface PrescriptionRow {
  id: string;
  prescriptionNumber: string;
  status: string;
  createdAt: string;
  customer: { name: string };
  pet: { name: string; species: string };
  prescriptionItems: Array<{ drug: { name: string } | null }>;
}

export default function PrescriptionsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PrescriptionRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPrescriptions({ page, search });
      setData(result.data as unknown as PrescriptionRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const columns: ColumnDef<PrescriptionRow>[] = [
    {
      id: "prescriptionNumber",
      header: "No. Resep",
      accessorKey: "prescriptionNumber",
    },
    {
      id: "date",
      header: "Tanggal",
      renderCell: (row) => formatDate(row.createdAt),
    },
    {
      id: "customer",
      header: "Pelanggan",
      renderCell: (row) => row.customer?.name || "-",
    },
    {
      id: "pet",
      header: "Hewan",
      renderCell: (row) => `${row.pet?.name || "-"} (${row.pet?.species || "-"})`,
    },
    {
      id: "drugs",
      header: "Obat",
      renderCell: (row) => {
        const count = row.prescriptionItems?.length || 0;
        return (
          <span className="text-muted-foreground">
            {count} obat
          </span>
        );
      },
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
          <Link href={`/prescriptions/${row.id}/print`} target="_blank">
            <Button variant="ghost" size="sm">
              <Download className="mr-1 h-3 w-3" />
              Cetak
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Resep</h1>
        <p className="text-sm text-muted-foreground">
          Daftar resep obat dari kunjungan
        </p>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nomor resep..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada resep"
        emptyDescription="Resep akan muncul setelah kunjungan selesai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
