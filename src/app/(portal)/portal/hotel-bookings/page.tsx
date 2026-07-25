import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toNumber } from "@/types";
import { Plus, Building2 } from "lucide-react";

export default async function PortalHotelBookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const bookings = await prisma.hotelBooking.findMany({
    where: { customerId: customer.id },
    include: {
      pet: { select: { name: true, species: true } },
      room: { select: { roomNumber: true, name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Booking Hotel</h1>
          <p className="text-sm text-muted-foreground">
            Daftar booking hotel hewan Anda
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/hotel-bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            Booking Kamar
          </Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada booking hotel.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/portal/hotel-bookings/new">Booking Kamar Pertama</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: any) => (
            <Card key={booking.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{booking.bookingNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.room.roomNumber} - {booking.room.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.pet.name} ({booking.pet.species})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check-in: {formatDate(booking.checkInDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check-out: {formatDate(booking.checkOutDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.totalDays} malam
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(toNumber(booking.total))}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <Link href={`/portal/hotel-bookings/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        Lihat Detail
                      </Button>
                    </Link>
                    {booking.status === "CONFIRMED" && (
                      <Link href={`/portal/hotel-bookings/${booking.id}/cancel`}>
                        <Button variant="outline" size="sm" className="text-destructive">
                          Batalkan
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
