import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Download, FileText } from "lucide-react";

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
    where: {
      visit: { customerId: customer.id },
    },
    include: {
      prescriptionItems: { include: { drug: true } },
      visit: {
        select: { visitNumber: true, pet: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Resep</h1>
        <p className="text-sm text-muted-foreground">
          Daftar resep obat hewan Anda
        </p>
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
            <Card key={rx.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium">{rx.prescriptionNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(rx.createdAt)}
                  </p>
                  {rx.visit && (
                    <p className="text-xs text-muted-foreground">
                      {rx.visit.visitNumber} - {rx.visit.pet?.name}
                    </p>
                  )}
                  {rx.prescriptionItems.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {rx.prescriptionItems.map((item: any) => (
                        <p
                          key={item.id}
                          className="text-xs text-muted-foreground"
                        >
                          - {item.drug?.name || "Obat"}
                          {item.dosage ? ` (${item.dosage})` : ""}
                          
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Download className="mr-1 h-3 w-3" />
                  Unduh
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
