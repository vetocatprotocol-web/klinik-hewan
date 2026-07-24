import { notFound } from "next/navigation";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

interface PortalVisitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortalVisitDetailPage({ params }: PortalVisitDetailPageProps) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;

  const visit = await prisma.visit.findFirst({
    where: {
      id,
      customer: { userId: session.user.id },
    },
    include: {
      pet: true,
      visitItems: {
        include: {
          service: true,
          drug: true,
        },
      },
      prescription: {
        include: {
          prescriptionItems: { include: { drug: true } },
        },
      },
    },
  });

  if (!visit) notFound();

  const services = visit.visitItems.filter((item) => item.itemType === "SERVICE");
  const drugs = visit.visitItems.filter((item) => item.itemType === "DRUG");

  // Find associated invoice
  const invoice = await prisma.invoice.findFirst({
    where: { sourceType: "VISIT", sourceId: visit.id },
    select: { id: true, invoiceNumber: true, status: true, total: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/visits" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{visit.visitNumber}</h1>
          <p className="text-sm text-muted-foreground">Detail kunjungan</p>
        </div>
        <StatusBadge status={visit.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Kunjungan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(visit.visitDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hewan</p>
                  <p className="font-medium">{visit.pet.name} ({visit.pet.species})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catatan Medis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Keluhan Utama</p>
                <p className="text-sm">{visit.chiefComplaint}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diagnosis</p>
                <p className="text-sm">{visit.diagnosis}</p>
              </div>
              {visit.physicalExamNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Pemeriksaan Fisik</p>
                  <p className="text-sm">{visit.physicalExamNotes}</p>
                </div>
              )}
              {visit.treatmentNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Catatan Perawatan</p>
                  <p className="text-sm">{visit.treatmentNotes}</p>
                </div>
              )}
              <div className="flex gap-4 text-sm">
                {visit.weightKg && <div><span className="text-muted-foreground">Berat:</span> {Number(visit.weightKg)} kg</div>}
                {visit.temperature && <div><span className="text-muted-foreground">Suhu:</span> {Number(visit.temperature)}°C</div>}
                {visit.heartRate && <div><span className="text-muted-foreground">Detak Jantung:</span> {visit.heartRate} bpm</div>}
              </div>
            </CardContent>
          </Card>

          {services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Layanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {services.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{item.service?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(Number(item.unitPrice))}</p>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(Number(item.subtotal))}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {drugs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Obat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {drugs.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.drug?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(Number(item.unitPrice))}</p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(Number(item.subtotal))}</p>
                      </div>
                      {(item.dosage || item.durationDays || item.instructions) && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {item.dosage && <p>Dosis: {item.dosage}</p>}
                          {item.durationDays && <p>Durasi: {item.durationDays} hari</p>}
                          {item.instructions && <p>Instruksi: {item.instructions}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {visit.prescription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resep</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Resep</p>
                  <p className="font-medium">{visit.prescription.prescriptionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(visit.prescription.prescriptionDate)}</p>
                </div>
                <div>
                  <StatusBadge status={visit.prescription.status} />
                </div>
                {visit.prescription.prescriptionItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Daftar Obat:</p>
                    {visit.prescription.prescriptionItems.map((item) => (
                      <div key={item.id} className="rounded border p-2 text-xs">
                        <p className="font-medium">{item.drug?.name}</p>
                        <p>Jumlah: {item.quantity}</p>
                        {item.dosage && <p>Dosis: {item.dosage}</p>}
                        {item.durationDays && <p>Durasi: {item.durationDays} hari</p>}
                        {item.instructions && <p>Instruksi: {item.instructions}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {visit.prescription && (
                  <Link href={`/portal/prescriptions/${visit.prescription.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <FileText className="mr-2 h-4 w-4" />
                      Lihat Resep Lengkap
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Invoice</p>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">{formatCurrency(Number(invoice.total))}</p>
                </div>
                <StatusBadge status={invoice.status} />
                <Link href={`/portal/invoices/${invoice.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Lihat Invoice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
