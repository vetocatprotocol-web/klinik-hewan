import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatDate } from "@/lib/utils";
import { ArrowLeft, Printer, CheckCircle, XCircle } from "lucide-react";
import { completePrescription, cancelPrescription } from "@/server/actions/prescriptions";
import { PrescriptionActions } from "./prescription-actions";

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  const { id } = await params;
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      pet: { select: { name: true, species: true, breed: true } },
      prescriptionItems: { include: { drug: true } },
      visit: { select: { visitNumber: true, diagnosis: true } },
    },
  });

  if (!prescription) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/prescriptions"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Resep {prescription.prescriptionNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Detail resep obat
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={prescription.status} />
          <Link
            href={`/prescriptions/${prescription.id}/print`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Resep</CardTitle>
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
                {prescription.visit && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kunjungan</p>
                    <Link
                      href={`/visits/${prescription.visitId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {prescription.visit.visitNumber}
                    </Link>
                  </div>
                )}
                {prescription.visit?.diagnosis && (
                  <div>
                    <p className="text-sm text-muted-foreground">Diagnosis</p>
                    <p className="font-medium">{prescription.visit.diagnosis}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item Resep</CardTitle>
            </CardHeader>
            <CardContent>
              {prescription.prescriptionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada item resep
                </p>
              ) : (
                <div className="space-y-3">
                  {prescription.prescriptionItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.drug.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Jumlah: {item.quantity}
                          </p>
                        </div>
                      </div>
                      {(item.dosage || item.durationDays || item.instructions) && (
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {item.dosage && <p>Dosis: {item.dosage}</p>}
                          {item.durationDays && <p>Durasi: {item.durationDays} hari</p>}
                          {item.instructions && <p>Instruksi: {item.instructions}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pelanggan & Hewan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Pelanggan</p>
                <Link
                  href={`/customers/${prescription.customerId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {prescription.customer.name}
                </Link>
                {prescription.customer.phone && (
                  <p className="text-sm text-muted-foreground">
                    {prescription.customer.phone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hewan</p>
                <p className="font-medium">
                  {prescription.pet.name} ({prescription.pet.species})
                </p>
                {prescription.pet.breed && (
                  <p className="text-sm text-muted-foreground">
                    {prescription.pet.breed}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <PrescriptionActions
            prescriptionId={prescription.id}
            status={prescription.status}
          />
        </div>
      </div>
    </div>
  );
}
