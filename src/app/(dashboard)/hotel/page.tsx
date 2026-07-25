"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, BedDouble, Wrench, CheckCircle } from "lucide-react";
import { fetchHotelRooms, fetchHotelBookings } from "@/server/actions/queries";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface RoomRow {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  status: string;
  dailyRate: number;
  capacity: number;
  currentOccupancy: number;
}

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

const ROOM_STATUS_ICONS: Record<string, React.ReactNode> = {
  AVAILABLE: <CheckCircle className="h-5 w-5 text-green-600" />,
  OCCUPIED: <BedDouble className="h-5 w-5 text-blue-600" />,
  MAINTENANCE: <Wrench className="h-5 w-5 text-yellow-600" />,
};

export default function HotelPage() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchHotelRooms({ page });
      setRooms(result.data as unknown as RoomRow[]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchHotelBookings({
        page,
        status: status || undefined,
      });
      setBookings(result.data as unknown as BookingRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    if (activeTab === "rooms") {
      fetchRooms();
    } else {
      fetchBookings();
    }
  }, [activeTab, fetchRooms, fetchBookings]);

  useEffect(() => {
    setPage(1);
  }, [status, activeTab]);

  const bookingColumns: ColumnDef<BookingRow>[] = [
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
          <h1 className="text-2xl font-bold">Hotel</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kamar dan booking hotel
          </p>
        </div>
        <Link href="/hotel/bookings/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Booking
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rooms">Daftar Kamar</TabsTrigger>
          <TabsTrigger value="bookings">Booking</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 space-y-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-6 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Belum ada kamar tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/hotel/rooms/${room.id}`}
                  className="block"
                >
                  <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Kamar {room.roomNumber}
                        </p>
                        <h3 className="text-lg font-semibold">{room.name}</h3>
                      </div>
                      {ROOM_STATUS_ICONS[room.status] || (
                        <StatusBadge status={room.status} />
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>Tipe: {room.type}</p>
                      <p>Harga: {formatCurrency(Number(room.dailyRate))}/hari</p>
                      <p>
                        Okupansi: {room.currentOccupancy}/{room.capacity}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings">
          <DataTableToolbar>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataTableToolbar>

          <DataTable
            columns={bookingColumns}
            data={bookings}
            loading={loading}
            emptyTitle="Belum ada booking"
            emptyDescription="Buat booking baru untuk memulai"
          />

          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
