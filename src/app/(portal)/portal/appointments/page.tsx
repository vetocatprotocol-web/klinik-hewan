import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { Plus, Calendar } from "lucide-react";

export default async function PortalAppointmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const appointments = await prisma.appointment.findMany({
    where: { customerId: customer.id },
    include: {
      pet: { select: { name: true, species: true } },
      doctor: { select: { name: true } },
    },
    orderBy: [{ appointmentDate: "desc" }, { time: "desc" }],
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Janji Temu</h1>
          <p className="text-sm text-muted-foreground">
            Daftar janji temu hewan Anda
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat Janji Temu
          </Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada janji temu.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/portal/appointments/new">Buat Janji Temu Pertama</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment: any) => (
            <Card key={appointment.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{appointment.appointmentNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(appointment.appointmentDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Jam: {appointment.time}
                    </p>
                    <p className="text-sm">
                      Dr. {appointment.doctor.name}
                    </p>
                    <p className="text-sm">
                      {appointment.pet.name} ({appointment.pet.species})
                    </p>
                    {appointment.notes && (
                      <p className="text-xs text-muted-foreground">{appointment.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={appointment.status} />
                    {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                      <Link href={`/portal/appointments/${appointment.id}`}>
                        <Button variant="outline" size="sm">
                          Kelola
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
