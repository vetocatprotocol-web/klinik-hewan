import { notFound } from "next/navigation";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

interface PortalAppointmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortalAppointmentDetailPage({
  params,
}: PortalAppointmentDetailPageProps) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      customer: { userId: session.user.id },
    },
    include: {
      pet: { select: { name: true, species: true } },
      doctor: { select: { name: true } },
    },
  });

  if (!appointment) notFound();

  const canCancel =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/appointments"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {appointment.appointmentNumber}
            </h1>
            <p className="text-sm text-muted-foreground">Detail janji temu</p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        {canCancel && (
          <Link href={`/portal/appointments/${appointment.id}/cancel`}>
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
              <CardTitle className="text-base">Informasi Janji Temu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Janji</p>
                  <p className="font-medium">
                    {appointment.appointmentNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {formatDate(appointment.appointmentDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jam</p>
                  <p className="font-medium">
                    {formatTime(appointment.time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipe</p>
                  <p className="font-medium">
                    {appointment.type || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catatan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {appointment.notes || "Tidak ada catatan"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dokter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">Dr. {appointment.doctor.name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hewan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {appointment.pet.name} ({appointment.pet.species})
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
