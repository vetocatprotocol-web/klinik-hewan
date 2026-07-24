import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VisitCard } from "@/components/cards/visit-card";
import { InvoiceCard } from "@/components/cards/invoice-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PawPrint } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/server/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function PortalDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: {
      pets: { select: { id: true, name: true, species: true, breed: true } },
    },
  });

  if (!customer) redirect("/login");

  const [recentVisits, unpaidInvoices] = await Promise.all([
    prisma.visit.findMany({
      where: { customerId: customer.id },
      include: {
        pet: { select: { name: true } },
      },
      orderBy: { visitDate: "desc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Halo, {customer.name}!</h1>
        <p className="text-muted-foreground">
          Selamat datang di portal PetCare.
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hewan Saya</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/pets">Lihat Semua</Link>
          </Button>
        </div>
        {customer.pets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <PawPrint className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada hewan terdaftar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customer.pets.map((pet: any) => (
              <Card key={pet.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-muted p-3">
                    <PawPrint className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pet.species}
                      {pet.breed ? ` - ${pet.breed}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Kunjungan Terakhir</h2>
          {recentVisits.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada riwayat kunjungan.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentVisits.map((visit: any) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{visit.visitNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {visit.pet.name}
                    </p>
                  </div>
                  <StatusBadge status={visit.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Invoice Belum Dibayar</h2>
          {unpaidInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada invoice tertunda.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {unpaidInvoices.map((invoice: any) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={{
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceDate: invoice.invoiceDate.toISOString(),
                    total: Number(invoice.total),
                    status: invoice.status,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
