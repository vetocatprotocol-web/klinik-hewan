"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchReconciliations } from "@/server/actions/queries";
import { approveReconciliation, requestReconciliationRevision } from "@/server/actions/reconciliation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDate, formatCurrency } from "@/lib/utils";

interface ReconciliationRow {
  id: string;
  date: string;
  totalPOS: number;
  totalInvoice: number;
  totalPayments: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  expectedCard: number;
  actualCard: number;
  cardDifference: number;
  status: string;
  notes: string | null;
  kasir: { id: string; name: string };
  reviewer: { id: string; name: string } | null;
}

const RECONCILIATION_STATUSES = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export default function ReconciliationPage() {
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReconciliationRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [revisionNotes, setRevisionNotes] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchReconciliations({
        page,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(result.data as unknown as ReconciliationRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, status, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [status, dateFrom, dateTo]);

  const handleApprove = async (id: string) => {
    startTransition(async () => {
      const result = await approveReconciliation(id);
      if (result.success) {
        fetchData();
      }
    });
  };

  const handleRevision = async () => {
    if (!selectedId || !revisionNotes.trim()) return;
    startTransition(async () => {
      const result = await requestReconciliationRevision(selectedId, revisionNotes);
      if (result.success) {
        setRevisionDialogOpen(false);
        setSelectedId("");
        setRevisionNotes("");
        fetchData();
      }
    });
  };

  const openRevisionDialog = (id: string) => {
    setSelectedId(id);
    setRevisionNotes("");
    setRevisionDialogOpen(true);
  };

  const columns: ColumnDef<ReconciliationRow>[] = [
    {
      id: "date",
      header: "Tanggal",
      renderCell: (row) => formatDate(row.date),
    },
    {
      id: "kasir",
      header: "Kasir",
      renderCell: (row) => row.kasir.name,
    },
    {
      id: "totalPOS",
      header: "Total POS",
      renderCell: (row) => formatCurrency(Number(row.totalPOS)),
    },
    {
      id: "totalInvoice",
      header: "Total Invoice",
      renderCell: (row) => formatCurrency(Number(row.totalInvoice)),
    },
    {
      id: "actualCash",
      header: "Kas Aktual",
      renderCell: (row) => formatCurrency(Number(row.actualCash)),
    },
    {
      id: "cashDifference",
      header: "Selisih Kas",
      renderCell: (row) => {
        const diff = Number(row.cashDifference);
        return (
          <span className={diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-red-600"}>
            {formatCurrency(diff)}
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
          <Link
            href={`/reconciliation/${row.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Lihat
          </Link>
          {row.status === "PENDING" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApprove(row.id)}
                disabled={isPending}
              >
                Setujui
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openRevisionDialog(row.id)}
                disabled={isPending}
              >
                Minta Perbaikan
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rekonsiliasi Harian</h1>
          <p className="text-sm text-muted-foreground">
            Rekonsiliasi kas dan pembayaran harian
          </p>
        </div>
        <Link href="/reconciliation/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Submit Rekonsiliasi
        </Link>
      </div>

      <DataTableToolbar>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {RECONCILIATION_STATUSES.map((s) => (
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
        emptyTitle="Belum ada rekonsiliasi"
        emptyDescription="Submit rekonsiliasi harian untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta Perbaikan Rekonsiliasi</DialogTitle>
            <DialogDescription>
              Berikan catatan mengenai perbaikan yang diperlukan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full border rounded-md p-2 min-h-[100px]"
              placeholder="Masukkan catatan perbaikan..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevisionDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleRevision}
              disabled={isPending || !revisionNotes.trim()}
            >
              Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
