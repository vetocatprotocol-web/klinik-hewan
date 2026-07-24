import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Edit, CheckCircle, Printer } from "lucide-react";
import { CompleteVisitButton } from "./complete-visit-button";

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      creator: { select: { id: true, name: true } },
      visitItems: { include: { service: true, drug: true } },
      prescription: { include: { prescriptionItems: { include: { drug: true } } } },
    },
  });

  if (!visit) notFound();

  const invoice = await prisma.invoice.findFirst({
    where: { sourceType: "VISIT", sourceId: visit.id },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/visits"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Kunjungan {visit.visitNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(visit.visitDate)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <StatusBadge status={visit.status} />
          <Link href={`/visits/${visit.id}/print`}><Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" />Cetak</Button></Link>
          {visit.status === "DRAFT" && (
            <>
              <Link href={`/visits/${visit.id}/edit`}><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button></Link>
              <CompleteVisitButton visitId={visit.id} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Informasi Kunjungan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Pelanggan:</span><p className="font-medium">{visit.customer.name}</p></div>
                <div><span className="text-muted-foreground">Hewan:</span><p className="font-medium">{visit.pet.name} ({visit.pet.species})</p></div>
                <div><span className="text-muted-foreground">Dokter:</span><p className="font-medium">{visit.creator.name}</p></div>
                <div><span className="text-muted-foreground">Tanggal:</span><p className="font-medium">{formatDateTime(visit.visitDate)}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Medical Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><span className="text-sm text-muted-foreground">Keluhan Utama:</span><p className="text-sm">{visit.chiefComplaint}</p></div>
              <div><span className="text-sm text-muted-foreground">Diagnosis:</span><p className="text-sm">{visit.diagnosis}</p></div>
              {visit.physicalExamNotes && <div><span className="text-sm text-muted-foreground">Pemeriksaan Fisik:</span><p className="text-sm">{visit.physicalExamNotes}</p></div>}
              {visit.treatmentNotes && <div><span className="text-sm text-muted-foreground">Catatan Perawatan:</span><p className="text-sm">{visit.treatmentNotes}</p></div>}
              <div className="flex gap-4 text-sm">
                {visit.weightKg && <div><span className="text-muted-foreground">Berat:</span> {Number(visit.weightKg)} kg</div>}
                {visit.temperature && <div><span className="text-muted-foreground">Suhu:</span> {Number(visit.temperature)}°C</div>}
                {visit.heartRate && <div><span className="text-muted-foreground">Detak Jantung:</span> {visit.heartRate} bpm</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Layanan & Obat</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visit.visitItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded border p-3 text-sm">
                    <div>
                      <p className="font-medium">{item.service?.name || item.drug?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.itemType === "SERVICE" ? "Layanan" : "Obat"}</p>
                    </div>
                    <div className="text-right">
                      <p>{item.quantity} x {formatCurrency(Number(item.unitPrice))}</p>
                      <p className="font-medium">{formatCurrency(Number(item.subtotal))}</p>
                    </div>
                  </div>
                ))}
                {visit.visitItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada layanan atau obat</p>}
              </div>
              <div className="mt-4 border-t pt-3 text-right font-bold">
                Total: {formatCurrency(visit.visitItems.reduce((sum, i) => sum + Number(i.subtotal), 0))}
              </div>
            </CardContent>
          </Card>

          {visit.prescription && (
            <Card>
              <CardHeader><CardTitle>Resep</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{visit.prescription.prescriptionNumber}</p>
                <div className="space-y-2">
                  {visit.prescription.prescriptionItems.map((pi) => (
                    <div key={pi.id} className="rounded border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{pi.drug.name}</p>
                        <p>Jumlah: {pi.quantity}</p>
                      </div>
                      {(pi.dosage || pi.durationDays || pi.instructions) && (
                        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          {pi.dosage && <p>Dosis: {pi.dosage}</p>}
                          {pi.durationDays && <p>Durasi: {pi.durationDays} hari</p>}
                          {pi.instructions && <p>Instruksi: {pi.instructions}</p>}
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
          {invoice && (
            <Card>
              <CardHeader><CardTitle>Invoice</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-muted-foreground">{formatCurrency(Number(invoice.total))}</p>
                  <StatusBadge status={invoice.status} className="mt-2" />
                </div>
                <Link href={`/invoices/${invoice.id}`}>
                  <Button variant="outline" size="sm" className="w-full">Lihat Invoice</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
