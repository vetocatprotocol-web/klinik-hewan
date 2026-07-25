"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelHotelBooking } from "@/server/actions/hotel";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CancelHotelBookingFormProps {
  bookingId: string;
  bookingNumber: string;
  roomNumber: string;
  roomName: string;
  petName: string;
  petSpecies: string;
  checkInDate: string;
  checkOutDate: string;
  totalDays: number;
}

export function CancelHotelBookingForm({
  bookingId,
  bookingNumber,
  roomNumber,
  roomName,
  petName,
  petSpecies,
  checkInDate,
  checkOutDate,
  totalDays,
}: CancelHotelBookingFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await cancelHotelBooking(bookingId, reason);
      if (result.success) {
        router.push("/portal/hotel-bookings");
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Link
          href="/portal/hotel-bookings"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Batalkan Booking</h1>
          <p className="text-sm text-muted-foreground">
            Konfirmasi pembatalan booking hotel
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Nomor Booking
                  </p>
                  <p className="font-medium">{bookingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kamar</p>
                  <p className="font-medium">
                    {roomNumber} - {roomName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hewan</p>
                  <p className="font-medium">
                    {petName} ({petSpecies})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hari</p>
                  <p className="font-medium">{totalDays} malam</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-medium">{formatDate(checkInDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium">{formatDate(checkOutDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pembatalan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Alasan Pembatalan</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Masukkan alasan pembatalan"
                    rows={4}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? "Membatalkan..." : "Batalkan Booking"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
