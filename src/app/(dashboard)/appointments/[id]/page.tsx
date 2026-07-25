import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppointmentById } from "@/server/queries/appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatTime } from "@/lib/utils";
import { ArrowLeft, Phone, Stethoscope, Calendar } from "lucide-react";
import { AppointmentActions } from "./appointment-actions";

interface AppointmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const { id } = await params;
  const appointment = await getAppointmentById(id);

  if (!appointment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/appointments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{appointment.appointmentNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Detail janji temu
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Janji Temu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="text-sm font-medium">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waktu</p>
                  <p className="text-sm font-medium">{formatTime(appointment.time)}</p>
                </div>
                {appointment.type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Jenis</p>
                    <p className="text-sm font-medium">{appointment.type}</p>
                  </div>
                )}
              </div>
              {appointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Catatan</p>
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {appointment.visits && appointment.visits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kunjungan Terkait</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointment.visits.map((visit) => (
                    <Link
                      key={visit.id}
                      href={`/visits/${visit.id}`}
                      className="flex items-center justify-between rounded border p-3 text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{visit.visitNumber}</span>
                      <StatusBadge status={visit.status} />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="text-sm font-medium">{appointment.customer.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{appointment.customer.phone}</p>
              </div>
              {appointment.customer.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{appointment.customer.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hewan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="text-sm font-medium">{appointment.pet.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jenis</p>
                <p className="text-sm">{appointment.pet.species}</p>
              </div>
              {appointment.pet.breed && (
                <div>
                  <p className="text-sm text-muted-foreground">Ras</p>
                  <p className="text-sm">{appointment.pet.breed}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dokter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{appointment.doctor.name}</p>
              </div>
            </CardContent>
          </Card>

          <AppointmentActions
            appointmentId={appointment.id}
            status={appointment.status}
          />
        </div>
      </div>
    </div>
  );
}
