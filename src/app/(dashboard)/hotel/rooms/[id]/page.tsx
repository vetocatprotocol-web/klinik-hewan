import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/server/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, BedDouble, Users, DollarSign, Wrench } from "lucide-react";

interface RoomDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = await params;
  const client = await prisma();

  const room = await client.hotelRoom.findUnique({
    where: { id },
    include: {
      bookings: {
        where: {
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          pet: { select: { name: true, species: true } },
        },
        orderBy: { checkInDate: "asc" },
      },
    },
  });

  if (!room) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/hotel"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-sm text-muted-foreground">
              Kamar {room.roomNumber}
            </p>
          </div>
        </div>
        <StatusBadge status={room.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Kamar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Kamar</p>
                  <p className="font-medium">{room.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{room.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipe</p>
                  <p className="font-medium">{room.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kapasitas</p>
                    <p className="font-medium">{room.capacity}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tarif per Hari</p>
                  <p className="font-medium text-lg">{formatCurrency(Number(room.dailyRate))}</p>
                </div>
              </div>
              {room.amenities && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fasilitas</p>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.split(",").map((amenity, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        {amenity.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                Okupansi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Okupansi Saat Ini</span>
                  <span className="font-medium">{room.currentOccupancy}/{room.capacity}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{
                      width: `${room.capacity > 0 ? (room.currentOccupancy / room.capacity) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {room.capacity - room.currentOccupancy} tempat tersisa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Aktif & Mendatang</CardTitle>
            </CardHeader>
            <CardContent>
              {room.bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tidak ada booking aktif
                </p>
              ) : (
                <div className="space-y-3">
                  {room.bookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/hotel/bookings/${booking.id}`}
                      className="block rounded-md border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{booking.bookingNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.customer.name} - {booking.pet.name} ({booking.pet.species})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(booking.checkInDate)} s/d {formatDate(booking.checkOutDate)} ({booking.totalDays} hari)
                          </p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
