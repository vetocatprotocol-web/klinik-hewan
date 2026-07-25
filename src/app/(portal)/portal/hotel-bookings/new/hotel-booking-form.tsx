"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createHotelBooking, getAvailableRooms } from "@/server/actions/hotel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toNumber } from "@/types";

interface PortalHotelBookingFormProps {
  customerId: string;
  pets: { id: string; name: string; species: string }[];
  rooms: { id: string; roomNumber: string; name: string; type: string; dailyRate: any; capacity: number }[];
}

export function PortalHotelBookingForm({ customerId, pets, rooms }: PortalHotelBookingFormProps) {
  const router = useRouter();
  const [petId, setPetId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [notes, setNotes] = useState("");
  const [availableRooms, setAvailableRooms] = useState(rooms);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableRooms = useCallback(async () => {
    if (!checkInDate || !checkOutDate) {
      setAvailableRooms(rooms);
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setAvailableRooms([]);
      return;
    }
    setLoadingRooms(true);
    setRoomId("");
    try {
      const result = await getAvailableRooms(checkInDate, checkOutDate);
      if (result.success && result.data) {
        setAvailableRooms(result.data);
      } else {
        setAvailableRooms([]);
        if (!result.success) {
          setError(result.error.message || "Gagal memuat kamar tersedia");
        }
      }
    } catch {
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [checkInDate, checkOutDate, rooms]);

  useEffect(() => {
    fetchAvailableRooms();
  }, [fetchAvailableRooms]);

  const selectedRoom = availableRooms.find((r) => r.id === roomId);

  const estimatedTotal = (() => {
    if (!selectedRoom || !checkInDate || !checkOutDate) return null;
    const ci = new Date(checkInDate);
    const co = new Date(checkOutDate);
    if (co <= ci) return null;
    const totalDays = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    return {
      totalDays,
      dailyRate: toNumber(selectedRoom.dailyRate),
      total: totalDays * toNumber(selectedRoom.dailyRate),
    };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("customerId", customerId);
      formData.set("petId", petId);
      formData.set("roomId", roomId);
      formData.set("checkInDate", checkInDate);
      formData.set("checkOutDate", checkOutDate);
      if (notes) formData.set("notes", notes);

      const result = await createHotelBooking(null, formData);
      if (result.success) {
        router.push("/portal/hotel-bookings");
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label>Pilih Hewan *</Label>
        <Select value={petId} onValueChange={setPetId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih hewan" />
          </SelectTrigger>
          <SelectContent>
            {pets.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkInDate">Tanggal Check-in *</Label>
          <Input
            id="checkInDate"
            type="date"
            min={today}
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkOutDate">Tanggal Check-out *</Label>
          <Input
            id="checkOutDate"
            type="date"
            min={checkInDate || today}
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Pilih Tipe Kamar *</Label>
        {loadingRooms ? (
          <p className="text-sm text-muted-foreground">Memuat kamar tersedia...</p>
        ) : availableRooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {checkInDate && checkOutDate
              ? "Tidak ada kamar tersedia pada tanggal tersebut"
              : "Pilih tanggal check-in dan check-out terlebih dahulu"}
          </p>
        ) : (
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kamar" />
            </SelectTrigger>
            <SelectContent>
              {availableRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.roomNumber} - {room.name} ({room.type}) - {formatCurrency(toNumber(room.dailyRate))}/malam
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan tambahan"
        />
      </div>
      {estimatedTotal && (
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Estimasi Biaya</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {estimatedTotal.totalDays} malam x {formatCurrency(estimatedTotal.dailyRate)}
            </span>
            <span className="font-medium">{formatCurrency(estimatedTotal.total)}</span>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting || !roomId || !petId}>
          {submitting ? "Memesan..." : "Booking Kamar"}
        </Button>
      </div>
    </form>
  );
}
