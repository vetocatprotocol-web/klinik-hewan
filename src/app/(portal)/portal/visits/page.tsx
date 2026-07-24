import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Clock } from "lucide-react";

interface PortalVisitsProps {
  searchParams: Promise<{ pet?: string; status?: string; dateFrom?: string; dateTo?: string }>;
}

export default async function PortalVisitsPage({ searchParams }: PortalVisitsProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const pets = await prisma.pet.findMany({
    where: { customerId: customer.id, status: "ACTIVE" },
    select: { id: true, name: true, species: true },
  });

  const where: any = { customerId: customer.id };
  if (params.pet) where.petId = params.pet;
  if (params.status) where.status = params.status;
  if (params.dateFrom || params.dateTo) {
    where.visitDate = {};
    if (params.dateFrom) where.visitDate.gte = new Date(params.dateFrom);
    if (params.dateTo) where.visitDate.lte = new Date(params.dateTo);
  }

  const visits = await prisma.visit.findMany({
    where,
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

      <form className="flex flex-wrap gap-3">
        <select name="pet" defaultValue={params.pet || ""} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Semua Hewan</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
          ))}
        </select>
        <select name="status" defaultValue={params.status || ""} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="COMPLETED">Selesai</option>
          <option value="PAID">Dibayar</option>
        </select>
        <input type="date" name="dateFrom" defaultValue={params.dateFrom || ""} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Dari" />
        <input type="date" name="dateTo" defaultValue={params.dateTo || ""} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Sampai" />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">Filter</button>
      </form>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada riwayat kunjungan.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <Link key={visit.id} href={`/portal/visits/${visit.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{visit.visitNumber}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(visit.visitDate)}</p>
                      <p className="text-sm">{visit.pet.name} ({visit.pet.species})</p>
                      {visit.diagnosis && <p className="text-sm text-muted-foreground">{visit.diagnosis}</p>}
                      {visit.visitItems.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {visit.visitItems.map((item) => (
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
