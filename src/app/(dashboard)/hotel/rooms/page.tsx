"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, BedDouble, Wrench, CheckCircle } from "lucide-react";
import { fetchHotelRooms } from "@/server/actions/queries";
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
import { cn, formatCurrency } from "@/lib/utils";

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

const ROOM_STATUSES = [
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "OCCUPIED", label: "Terisi" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const ROOM_STATUS_ICONS: Record<string, React.ReactNode> = {
  AVAILABLE: <CheckCircle className="h-5 w-5 text-green-600" />,
  OCCUPIED: <BedDouble className="h-5 w-5 text-blue-600" />,
  MAINTENANCE: <Wrench className="h-5 w-5 text-yellow-600" />,
};

export default function HotelRoomsPage() {
  const [status, setStatus] = useState("");
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchHotelRooms({ page: 1, status: status || undefined });
      setRooms(result.data as unknown as RoomRow[]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kamar Hotel</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kamar hotel klinik
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_ALL">Semua Status</SelectItem>
            {ROOM_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <p className="text-muted-foreground">Belum ada kamar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}
