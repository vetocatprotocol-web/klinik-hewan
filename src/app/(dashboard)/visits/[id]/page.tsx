import { notFound } from "next/navigation";
import Link from "next/link";
import { getVisitById } from "@/server/queries/visits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Printer, Edit } from "lucide-react";

interface VisitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VisitDetailPage({ params }: VisitDetailPageProps) {
  const { id } = await params;
  const visit = await getVisitById(id);

  if (!visit) {
    notFound();
  }

  const subtotal = visit.visitItems.reduce(
    (sum: number, item: any) => sum + Number(item.subtotal),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/visits"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{visit.visitNumber}</h1>
            <p className="text-sm text-muted-foreground">Detail kunjungan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={visit.status} />
          {visit.status === "DRAFT" && (
            <Link
              href={`/visits/${id}/edit`}
              className={cn(buttonVariants())}
            >
              <Edit className="mr-2 h-4 w-4" />
              Ubah
            </Link>
          )}
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kunjungan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="text-sm font-medium">{formatDate(visit.visitDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
                  <p className="text-sm font-medium">{visit.creator.name}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Keluhan Utama</p>
                <p className="text-sm">{visit.chiefComplaint}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diagnosis</p>
                <p className="text-sm font-medium">{visit.diagnosis}</p>
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
              <div className="grid gap-4 sm:grid-cols-3">
                {visit.weightKg != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Berat</p>
                    <p className="text-sm font-medium">{visit.weightKg} kg</p>
                  </div>
                )}
                {visit.temperature != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Suhu</p>
                    <p className="text-sm font-medium">{visit.temperature} °C</p>
                  </div>
                )}
                {visit.heartRate != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Detak Jantung</p>
                    <p className="text-sm font-medium">{visit.heartRate} bpm</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item Kunjungan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_100px_100px] gap-2 text-sm font-medium text-muted-foreground">
                  <span>Item</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Harga</span>
                  <span className="text-right">Subtotal</span>
                </div>
                {visit.visitItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_80px_100px_100px] gap-2 border-t py-2 text-sm"
                  >
                    <span>
                      {item.itemType === "SERVICE"
                        ? item.service?.name
                        : item.drug?.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({item.itemType === "SERVICE" ? "Layanan" : "Obat"})
                      </span>
                    </span>
                    <span className="text-right">{item.quantity}</span>
                    <span className="text-right">{formatCurrency(Number(item.unitPrice))}</span>
                    <span className="text-right font-medium">
                      {formatCurrency(Number(item.subtotal))}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 text-sm font-bold">
                  <div className="flex justify-end">
                    Total: {formatCurrency(subtotal)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {visit.prescription && (
            <Card>
              <CardHeader>
                <CardTitle>Resep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">No. Resep: </span>
                    {visit.prescription.prescriptionNumber}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tanggal: </span>
                    {formatDate(visit.prescription.prescriptionDate)}
                  </p>
                  {visit.prescription.prescriptionItems.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {visit.prescription.prescriptionItems.map((pi: any) => (
                        <div key={pi.id} className="text-sm">
                          - {pi.drug?.name} x{pi.quantity}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/customers/${visit.customer.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {visit.customer.name}
              </Link>
              <p className="text-sm text-muted-foreground">{visit.customer.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hewan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{visit.pet.name}</p>
              <p className="text-sm text-muted-foreground">{visit.pet.species}</p>
              {visit.pet.breed && (
                <p className="text-sm text-muted-foreground">{visit.pet.breed}</p>
              )}
            </CardContent>
          </Card>

          {visit.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/invoices/${visit.invoice.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {visit.invoice.invoiceNumber}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  Status: {visit.invoice.status}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
