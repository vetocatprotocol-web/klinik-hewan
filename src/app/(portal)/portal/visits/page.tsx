import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Clock } from "lucide-react";

export default async function PortalVisitsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const visits = await prisma.visit.findMany({
    where: { customerId: customer.id },
    include: {
      pet: { select: { name: true, species: true } },
      visitItems: { include: { service: true } },
    },
    orderBy: { visitDate: "desc" },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Riwayat Kunjungan</h1>
        <p className="text-sm text-muted-foreground">
          Daftar kunjungan hewan Anda ke klinik
        </p>
      </div>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Belum ada riwayat kunjungan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit: { id: string; visitNumber: string; visitDate: Date; status: string; diagnosis: string | null; pet: { name: string; species: string }; visitItems: { id: string; subtotal: unknown; service: { name: string } | null }[] }) => (
            <Link key={visit.id} href={`/portal/visits/${visit.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{visit.visitNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(visit.visitDate)}
                      </p>
                      <p className="text-sm">
                        {visit.pet.name} ({visit.pet.species})
                      </p>
                      {visit.diagnosis && (
                        <p className="text-sm text-muted-foreground">
                          {visit.diagnosis}
                        </p>
                      )}
                      {visit.visitItems.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {visit.visitItems.map((item: any) => (
                            <p key={item.id} className="text-xs text-muted-foreground">
                              - {item.service?.name || "Layanan"}
                              {item.subtotal ? ` (${formatCurrency(Number(item.subtotal))})` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={visit.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
