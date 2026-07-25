"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchAppointments } from "@/server/actions/queries";
import { confirmAppointment, completeAppointment, cancelAppointment, markNoShow } from "@/server/actions/appointments";
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
import { cn, formatDate, formatTime } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";

interface AppointmentRow {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  time: string;
  status: string;
  customer: { id: string; name: string; phone: string };
  pet: { id: string; name: string; species: string };
  doctor: { id: string; name: string };
}

const APPOINTMENT_STATUSES = [
  { value: "PENDING", label: "Menunggu" },
  { value: "CONFIRMED", label: "Dikonfirmasi" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
  { value: "NO_SHOW", label: "Tidak Hadir" },
];

export default function AppointmentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AppointmentRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAppointments({
        page,
        search,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(result.data as unknown as AppointmentRow[]);
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

  const handleAction = async (action: string, id: string) => {
    startTransition(async () => {
      try {
        let result;
        switch (action) {
          case "confirm":
            result = await confirmAppointment(id);
            break;
          case "complete":
            result = await completeAppointment(id);
            break;
          case "cancel":
            result = await cancelAppointment(id);
            break;
          case "noShow":
            result = await markNoShow(id);
            break;
          default:
            return;
        }
        if (result.success) {
          fetchData();
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  const columns: ColumnDef<AppointmentRow>[] = [
    {
      id: "appointmentNumber",
      header: "Nomor",
      renderCell: (row) => (
        <Link
          href={`/appointments/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.appointmentNumber}
        </Link>
      ),
    },
    {
      id: "appointmentDate",
      header: "Tanggal",
      renderCell: (row) => formatDate(row.appointmentDate),
    },
    {
      id: "time",
      header: "Waktu",
      renderCell: (row) => formatTime(row.time),
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
      id: "doctor",
      header: "Dokter",
      renderCell: (row) => row.doctor.name,
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
            href={`/appointments/${row.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Lihat
          </Link>
          {row.status === "PENDING" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("confirm", row.id)}
              disabled={isPending}
            >
              Konfirmasi
            </Button>
          )}
          {row.status === "CONFIRMED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("complete", row.id)}
              disabled={isPending}
            >
              Selesai
            </Button>
          )}
          {row.status === "PENDING" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("cancel", row.id)}
              disabled={isPending}
            >
              Batalkan
            </Button>
          )}
          {(row.status === "PENDING" || row.status === "CONFIRMED") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("noShow", row.id)}
              disabled={isPending}
            >
              Tidak Hadir
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Janji Temu</h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal janji temu pasien
          </p>
        </div>
        <Link href="/appointments/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Janji Temu
        </Link>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nomor atau nama pelanggan..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_STATUSES.map((s) => (
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
        emptyTitle="Belum ada janji temu"
        emptyDescription="Buat janji temu baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
