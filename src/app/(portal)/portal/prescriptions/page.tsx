import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { FileText, Download } from "lucide-react";

export default async function PortalPrescriptionsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const prescriptions = await prisma.prescription.findMany({
    where: { visit: { customerId: customer.id } },
    include: {
      prescriptionItems: { include: { drug: true } },
      visit: { select: { visitNumber: true, pet: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Resep</h1>
        <p className="text-sm text-muted-foreground">Daftar resep obat hewan Anda</p>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada resep.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx: any) => (
            <Card key={rx.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <Link href={`/portal/prescriptions/${rx.id}`} className="flex-1">
                    <div className="space-y-1">
                      <p className="font-medium">{rx.prescriptionNumber}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(rx.createdAt)}</p>
                      {rx.visit && (
                        <p className="text-xs text-muted-foreground">
                          {rx.visit.visitNumber} - {rx.visit.pet?.name}
                        </p>
                      )}
                      {rx.prescriptionItems.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {rx.prescriptionItems.map((item: any) => (
                            <p key={item.id} className="text-xs text-muted-foreground">
                              - {item.drug?.name || "Obat"}
                              {item.dosage ? ` (${item.dosage})` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                  <Link
                    href={`/portal/prescriptions/${rx.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Download className="h-3 w-3" />
                    Lihat
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
