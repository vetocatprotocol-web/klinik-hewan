import { notFound } from "next/navigation";
import Link from "next/link";
import { getReconciliationById } from "@/server/queries/reconciliation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ArrowLeft, User, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { ReconciliationActions } from "./reconciliation-actions";

interface ReconciliationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReconciliationDetailPage({ params }: ReconciliationDetailPageProps) {
  const { id } = await params;
  const reconciliation = await getReconciliationById(id);

  if (!reconciliation) {
    notFound();
  }

  const cashDiff = Number(reconciliation.cashDifference);
  const cardDiff = Number(reconciliation.cardDifference);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reconciliation">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Rekonsiliasi Harian</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(reconciliation.date)}
          </p>
        </div>
        <StatusBadge status={reconciliation.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Rekonsiliasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="text-sm font-medium">{formatDate(reconciliation.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kasir</p>
                    <p className="text-sm font-medium">{reconciliation.kasir.name}</p>
                  </div>
                </div>
                {reconciliation.reviewer && (
                  <div>
                    <p className="text-sm text-muted-foreground">Diverifikasi Oleh</p>
                    <p className="text-sm font-medium">{reconciliation.reviewer.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Keuangan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Total POS</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(reconciliation.totalPOS))}</p>
                </div>
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Total Invoice</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(reconciliation.totalInvoice))}</p>
                </div>
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(reconciliation.totalPayments))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rekonsiliasi Tunai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Diharapkan</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(reconciliation.expectedCash))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktual</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(reconciliation.actualCash))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selisih</p>
                  <p className={cn(
                    "text-lg font-bold",
                    cashDiff === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {cashDiff >= 0 ? "+" : ""}{formatCurrency(cashDiff)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rekonsiliasi Kartu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Diharapkan</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(reconciliation.expectedCard))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktual</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(reconciliation.actualCard))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selisih</p>
                  <p className={cn(
                    "text-lg font-bold",
                    cardDiff === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {cardDiff >= 0 ? "+" : ""}{formatCurrency(cardDiff)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {reconciliation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{reconciliation.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Selisih</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded border p-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Selisih Tunai</p>
                  <p className={cn(
                    "text-lg font-bold",
                    cashDiff === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {cashDiff >= 0 ? "+" : ""}{formatCurrency(cashDiff)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded border p-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Selisih Kartu</p>
                  <p className={cn(
                    "text-lg font-bold",
                    cardDiff === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {cardDiff >= 0 ? "+" : ""}{formatCurrency(cardDiff)}
                  </p>
                </div>
              </div>
              {(cashDiff !== 0 || cardDiff !== 0) && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Ada selisih yang perlu ditinjau</span>
                </div>
              )}
            </CardContent>
          </Card>

          {reconciliation.status === "PENDING" && (
            <ReconciliationActions reconciliationId={reconciliation.id} />
          )}
        </div>
      </div>
    </div>
  );
}
