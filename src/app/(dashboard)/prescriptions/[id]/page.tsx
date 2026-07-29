import { notFound } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { Printer, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { PrescriptionActions } from "./prescription-actions";

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  const session = await auth();
  if (!session?.user) notFound();
  
  const { id } = await params;
  
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      visit: { select: { visitNumber: true, diagnosis: true } },
      prescriptionItems: { include: { drug: true } },
    },
  });
  
  if (!prescription) notFound();
  
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resep {prescription.prescriptionNumber}</h1>
          <p className="text-muted-foreground">Detail resep obat</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/prescriptions/${id}/print`}>
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" />Cetak</Button>
          </Link>
          <PrescriptionActions 
            prescriptionId={prescription.id} 
            status={prescription.status} 
          />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informasi Resep</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Nomor Resep</span><span className="font-medium">{prescription.prescriptionNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span className="font-medium">{formatDate(prescription.prescriptionDate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[prescription.status]}>{prescription.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Kunjungan</span><span className="font-medium">{prescription.visit.visitNumber}</span></div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Data Pasien</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Pemilik</span><span className="font-medium">{prescription.customer.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Hewan</span><span className="font-medium">{prescription.pet.name} ({prescription.pet.species})</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Diagnosa</span><span className="font-medium">{prescription.visit.diagnosis}</span></div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Daftar Obat</CardTitle></CardHeader>
        <CardContent>
          {prescription.prescriptionItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Tidak ada obat dalam resep ini</p>
          ) : (
            <div className="space-y-4">
              {prescription.prescriptionItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{item.drug.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.drug.unit} · {item.quantity} unit
                      {item.dosage && ` · Dosis: ${item.dosage}`}
                      {item.durationDays && ` · ${item.durationDays} hari`}
                    </p>
                    {item.instructions && <p className="text-sm text-muted-foreground mt-1">Instruksi: {item.instructions}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
