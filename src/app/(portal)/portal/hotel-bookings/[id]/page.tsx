import { notFound } from "next/navigation";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toNumber } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

interface PortalHotelBookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortalHotelBookingDetailPage({
  params,
}: PortalHotelBookingDetailPageProps) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;

  const booking = await prisma.hotelBooking.findFirst({
    where: {
      id,
      customer: { userId: session.user.id },
    },
    include: {
      pet: { select: { name: true, species: true } },
      room: { select: { roomNumber: true, name: true, type: true } },
      services: true,
    },
  });

  if (!booking) notFound();

  const canCancel = booking.status === "CONFIRMED";

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/hotel-bookings"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{booking.bookingNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Detail booking hotel
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        {canCancel && (
          <Link href={`/portal/hotel-bookings/${booking.id}/cancel`}>
            <Button variant="destructive" size="sm">
              <X className="mr-2 h-4 w-4" />
              Batalkan
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Informasi Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Nomor Booking
                  </p>
                  <p className="font-medium">{booking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kamar</p>
                  <p className="font-medium">
                    {booking.room.roomNumber} - {booking.room.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipe Kamar</p>
                  <p className="font-medium">{booking.room.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hewan</p>
                  <p className="font-medium">
                    {booking.pet.name} ({booking.pet.species})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Periode Menginap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-medium">
                    {formatDate(booking.checkInDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {formatDate(booking.checkOutDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hari</p>
                  <p className="font-medium">{booking.totalDays} malam</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tarif per Hari
                  </p>
                  <p className="font-medium">
                    {formatCurrency(toNumber(booking.dailyRate))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {booking.services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Layanan Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {booking.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {service.serviceType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.quantity} x{" "}
                          {formatCurrency(toNumber(service.unitPrice))}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(toNumber(service.subtotal))}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Biaya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(toNumber(booking.subtotal))}</span>
              </div>
              {Number(booking.serviceFee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Biaya Layanan</span>
                  <span>
                    {formatCurrency(toNumber(booking.serviceFee))}
                  </span>
                </div>
              )}
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diskon</span>
                  <span className="text-destructive">
                    -{formatCurrency(toNumber(booking.discountAmount))}
                  </span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(toNumber(booking.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{booking.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
