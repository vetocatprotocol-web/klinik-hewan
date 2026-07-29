"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ReconciliationFormProps {
  date: string;
  expectedData: { totalPOS: number; expectedCash: number; expectedCard: number; totalInvoice: number; totalPayments: number; };
  onSubmit: (data: { actualCash: number; actualCard: number; totalPOS: number; totalInvoice: number; totalPayments: number; expectedCash: number; expectedCard: number; notes?: string; }) => Promise<any>;
}

export function ReconciliationForm({ date, expectedData, onSubmit }: ReconciliationFormProps) {
  const { toast } = useToast();
  const [actualCash, setActualCash] = useState(expectedData.expectedCash);
  const [actualCard, setActualCard] = useState(expectedData.expectedCard);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const cashDifference = actualCash - expectedData.expectedCash;
  const cardDifference = actualCard - expectedData.expectedCard;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({ actualCash, actualCard, totalPOS: expectedData.totalPOS, totalInvoice: expectedData.totalInvoice, totalPayments: expectedData.totalPayments, expectedCash: expectedData.expectedCash, expectedCard: expectedData.expectedCard, notes: notes || undefined });
      toast({ title: "Reconcilasi berhasil dikirim" });
    } catch { toast({ title: "Gagal mengirim reconcilasi", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Data Transaksi Hari Ini</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="flex justify-between"><span className="text-muted-foreground">Total POS</span><span className="font-medium">{formatCurrency(expectedData.totalPOS)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Total Invoice</span><span className="font-medium">{formatCurrency(expectedData.totalInvoice)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Total Pembayaran</span><span className="font-medium">{formatCurrency(expectedData.totalPayments)}</span></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Verifikasi Kas</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex justify-between"><span className="text-muted-foreground">Kas yang Diharapkan</span><span className="font-medium">{formatCurrency(expectedData.expectedCash)}</span></div>
        <div className="space-y-2"><Label htmlFor="actualCash">Kas Aktual (Hitung Fisik) <span className="text-destructive">*</span></Label><Input id="actualCash" type="number" value={actualCash} onChange={e => setActualCash(parseFloat(e.target.value) || 0)} /></div>
        <div className={`flex justify-between ${cashDifference !== 0 ? "text-amber-600" : ""}`}><span>Selisih Kas</span><span className="font-medium">{formatCurrency(cashDifference)}</span></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Verifikasi Kartu/Transfer</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex justify-between"><span className="text-muted-foreground">Kartu/Transfer yang Diharapkan</span><span className="font-medium">{formatCurrency(expectedData.expectedCard)}</span></div>
        <div className="space-y-2"><Label htmlFor="actualCard">Kartu/Transfer Aktual <span className="text-destructive">*</span></Label><Input id="actualCard" type="number" value={actualCard} onChange={e => setActualCard(parseFloat(e.target.value) || 0)} /></div>
        <div className={`flex justify-between ${cardDifference !== 0 ? "text-amber-600" : ""}`}><span>Selisih Kartu</span><span className="font-medium">{formatCurrency(cardDifference)}</span></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Catatan</CardTitle></CardHeader><CardContent>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan untuk reconcilasi hari ini..." />
      </CardContent></Card>
      <div className="flex justify-end"><Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Kirim Reconcilasi</Button></div>
    </div>
  );
}
