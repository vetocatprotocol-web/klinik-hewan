import { notFound } from "next/navigation";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalPrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortalPrescriptionDetailPage({ params }: PortalPrescriptionDetailPageProps) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;

  const prescription = await prisma.prescription.findFirst({
    where: {
      id,
      customer: { userId: session.user.id },
    },
    include: {
      visit: { select: { visitNumber: true, diagnosis: true } },
      pet: true,
      prescriptionItems: { include: { drug: true } },
    },
  });

  if (!prescription) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/prescriptions" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{prescription.prescriptionNumber}</h1>
          <p className="text-sm text-muted-foreground">Detail resep</p>
        </div>
        <StatusBadge status={prescription.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Resep</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Resep</p>
                  <p className="font-medium">{prescription.prescriptionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(prescription.prescriptionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hewan</p>
                  <p className="font-medium">{prescription.pet?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kunjungan Terkait</p>
                  <p className="font-medium">{prescription.visit?.visitNumber || "-"}</p>
                </div>
              </div>
              {prescription.visit?.diagnosis && (
                <div>
                  <p className="text-sm text-muted-foreground">Diagnosis</p>
                  <p className="text-sm">{prescription.visit.diagnosis}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar Obat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prescription.prescriptionItems.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{item.drug?.name}</p>
                      <p className="text-sm text-muted-foreground">Jumlah: {item.quantity}</p>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {item.dosage && <p>Dosis: {item.dosage}</p>}
                      {item.durationDays && <p>Durasi: {item.durationDays} hari</p>}
                      {item.instructions && <p>Instruksi: {item.instructions}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Status Resep</p>
        <div className="flex items-center gap-2">
          <StatusBadge status={prescription.status} />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
        </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Obat</p>
                <p className="font-medium">{prescription.prescriptionItems.length} obat</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
