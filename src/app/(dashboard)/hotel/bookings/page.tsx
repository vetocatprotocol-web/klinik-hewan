"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchHotelBookings } from "@/server/actions/queries";
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

interface BookingRow {
  id: string;
  bookingNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  total: number;
  customer: { id: string; name: string; phone: string };
  pet: { id: string; name: string; species: string };
  room: { id: string; roomNumber: string; name: string; type: string };
}

const BOOKING_STATUSES = [
  { value: "CONFIRMED", label: "Dikonfirmasi" },
  { value: "CHECKED_IN", label: "Check In" },
  { value: "CHECKED_OUT", label: "Check Out" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export default function HotelBookingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BookingRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchHotelBookings({
        page,
        status: status || undefined,
      });
      setData(result.data as unknown as BookingRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const columns: ColumnDef<BookingRow>[] = [
    {
      id: "bookingNumber",
      header: "Nomor Booking",
      renderCell: (row) => (
        <Link
          href={`/hotel/bookings/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.bookingNumber}
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
      renderCell: (row) => `${row.pet.name} (${row.pet.species})`,
    },
    {
      id: "room",
      header: "Kamar",
      renderCell: (row) => `${row.room.roomNumber} - ${row.room.name}`,
    },
    {
      id: "checkInDate",
      header: "Check In",
      renderCell: (row) => formatDate(row.checkInDate),
    },
    {
      id: "checkOutDate",
      header: "Check Out",
      renderCell: (row) => formatDate(row.checkOutDate),
    },
    {
      id: "total",
      header: "Total",
      renderCell: (row) => formatCurrency(row.total),
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
            href={`/hotel/bookings/${row.id}`}
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
          <h1 className="text-2xl font-bold">Booking Hotel</h1>
          <p className="text-sm text-muted-foreground">
            Kelola booking hotel klinik
          </p>
        </div>
        <Link
          href="/hotel/bookings/new"
          className={cn(buttonVariants())}
        >
          <Plus className="mr-2 h-4 w-4" />
          Buat Booking
        </Link>
      </div>

      <DataTableToolbar>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_ALL">Semua Status</SelectItem>
            {BOOKING_STATUSES.map((s) => (
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
        emptyTitle="Belum ada booking"
        emptyDescription="Buat booking baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
