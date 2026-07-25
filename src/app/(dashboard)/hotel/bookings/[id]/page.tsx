import { notFound } from "next/navigation";
import Link from "next/link";
import { getHotelBookingById } from "@/server/queries/hotel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, PawPrint, BedDouble, CreditCard } from "lucide-react";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  const booking = await getHotelBookingById(id);

  if (!booking) {
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
            <h1 className="text-2xl font-bold">Booking {booking.bookingNumber}</h1>
            <p className="text-sm text-muted-foreground">Detail booking hotel</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                Informasi Kamar
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nomor Kamar</p>
                <p className="font-medium">{booking.room.roomNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nama Kamar</p>
                <p className="font-medium">{booking.room.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipe</p>
                <p className="font-medium">{booking.room.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Kamar</p>
                <StatusBadge status={booking.room.status} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                Informasi Pelanggan & Hewan
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nama Pelanggan</p>
                <p className="font-medium">{booking.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telepon</p>
                <p className="font-medium">{booking.customer.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nama Hewan</p>
                <p className="font-medium">{booking.pet.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spesies</p>
                <p className="font-medium">{booking.pet.species}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tanggal Menginap
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Check In</p>
                <p className="font-medium">{formatDate(booking.checkInDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check Out</p>
                <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hari</p>
                <p className="font-medium">{booking.totalDays} hari</p>
              </div>
            </CardContent>
          </Card>

          {booking.services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Layanan Tambahan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Jenis Layanan</th>
                        <th className="text-right py-2 font-medium">Qty</th>
                        <th className="text-right py-2 font-medium">Harga Satuan</th>
                        <th className="text-right py-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.services.map((service) => (
                        <tr key={service.id} className="border-b last:border-0">
                          <td className="py-2">{service.serviceType}</td>
                          <td className="py-2 text-right">{service.quantity}</td>
                          <td className="py-2 text-right">{formatCurrency(Number(service.unitPrice))}</td>
                          <td className="py-2 text-right">{formatCurrency(Number(service.subtotal))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Ringkasan Biaya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tarif per Hari</span>
                <span>{formatCurrency(Number(booking.dailyRate))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({booking.totalDays} hari)</span>
                <span>{formatCurrency(Number(booking.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya Layanan</span>
                <span>{formatCurrency(Number(booking.serviceFee))}</span>
              </div>
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diskon</span>
                  <span className="text-green-600">-{formatCurrency(Number(booking.discountAmount))}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(Number(booking.total))}</span>
              </div>
            </CardContent>
          </Card>

          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{booking.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Info Lainnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat Oleh</span>
                <span>{booking.creator.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Dibuat</span>
                <span>{formatDate(booking.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
