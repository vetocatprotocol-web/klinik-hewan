import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, calculateAge } from "@/lib/utils";
import { Pencil, PawPrint, ArrowLeft } from "lucide-react";

export default async function PortalPetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const pet = await prisma.pet.findFirst({
    where: { id, customerId: customer.id },
    include: {
      visits: {
        include: {
          visitItems: { include: { service: true } },
        },
        orderBy: { visitDate: "desc" },
      },
    } as any,
  }) as any;

  if (!pet) redirect("/portal/pets");

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/pets">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{pet.name}</h1>
          <p className="text-sm text-muted-foreground">
            {pet.species}
            {pet.breed ? ` - ${pet.breed}` : ""}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/portal/pets/${pet.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Ubah
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Hewan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-3">
                <PawPrint className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{pet.name}</p>
                <p className="text-sm text-muted-foreground">{pet.species}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Ras</p>
                <p className="font-medium">{pet.breed || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Usia</p>
                <p className="font-medium">
                  {pet.birthDate ? calculateAge(pet.birthDate) : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Berat</p>
                <p className="font-medium">
                  {pet.weightKg ? `${pet.weightKg} kg` : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Warna</p>
                <p className="font-medium">{pet.colorMarking || "-"}</p>
              </div>
            </div>
            {pet.medicalHistoryNotes && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Riwayat Kesehatan
                </p>
                <p className="text-sm">{pet.medicalHistoryNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Kunjungan</CardTitle>
          </CardHeader>
          <CardContent>
            {pet.visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada riwayat kunjungan.
              </p>
            ) : (
              <div className="space-y-3">
                {pet.visits.map((visit: any) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {visit.visitNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(visit.visitDate)}
                      </p>
                      {visit.diagnosis && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {visit.diagnosis}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={visit.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
