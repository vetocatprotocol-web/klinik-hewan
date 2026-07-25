"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { submitDailyReconciliation, getDailyReconciliation } from "@/server/actions/reconciliation";
import { formatCurrency, cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

type ReconciliationData = {
  totalPOS: number;
  totalInvoice: number;
  totalPayments: number;
  expectedCash: number;
  expectedCard: number;
};

export default function NewReconciliationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [actualCard, setActualCard] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [expectedData, setExpectedData] = useState<ReconciliationData | null>(null);

  useEffect(() => {
    async function loadExpected() {
      if (!selectedDate) {
        setExpectedData(null);
        return;
      }
      setLoadingData(true);
      try {
        const result = await getDailyReconciliation(selectedDate);
        if (result.success) {
          setExpectedData(result.data);
        } else {
          setExpectedData(null);
        }
      } catch {
        setExpectedData(null);
      }
      setLoadingData(false);
    }
    loadExpected();
  }, [selectedDate]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await submitDailyReconciliation(_prev, formData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Rekonsiliasi berhasil disubmit" });
        router.push("/reconciliation");
      } else {
        toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
      }
      return result;
    },
    null
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reconciliation" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Rekonsiliasi Baru</h1>
          <p className="text-sm text-muted-foreground">
            Isi data rekonsiliasi harian
          </p>
        </div>
      </div>

      {state && !state.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.error.message}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Rekonsiliasi</CardTitle>
            <CardDescription>
              Pilih tanggal dan isi data aktual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {loadingData && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {expectedData && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Total POS</p>
                    <p className="text-lg font-bold">{formatCurrency(expectedData.totalPOS)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Total Invoice</p>
                    <p className="text-lg font-bold">{formatCurrency(expectedData.totalInvoice)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                    <p className="text-lg font-bold">{formatCurrency(expectedData.totalPayments)}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Tunai Diharapkan</p>
                    <p className="text-lg font-bold">{formatCurrency(expectedData.expectedCash)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Kartu Diharapkan</p>
                    <p className="text-lg font-bold">{formatCurrency(expectedData.expectedCard)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Aktual</CardTitle>
            <CardDescription>
              Masukkan jumlah aktual yang ada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="actualCash">Tunai Aktual *</Label>
                <Input
                  id="actualCash"
                  name="actualCash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="0"
                />
                {expectedData && actualCash && (
                  <p className="text-xs text-muted-foreground">
                    Selisih: {formatCurrency(Number(actualCash) - expectedData.expectedCash)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualCard">Kartu Aktual *</Label>
                <Input
                  id="actualCard"
                  name="actualCard"
                  type="number"
                  step="0.01"
                  min="0"
                  value={actualCard}
                  onChange={(e) => setActualCard(e.target.value)}
                  placeholder="0"
                />
                {expectedData && actualCard && (
                  <p className="text-xs text-muted-foreground">
                    Selisih: {formatCurrency(Number(actualCard) - expectedData.expectedCard)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/reconciliation" className={cn(buttonVariants({ variant: "outline" }))}>
            Batal
          </Link>
          <Button type="submit" disabled={isPending || !selectedDate}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
