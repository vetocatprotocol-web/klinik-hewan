"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PaymentFormProps {
  invoiceId: string;
  remainingBalance: number;
  onSubmit: (data: { paymentMethod: string; amount: number; notes?: string }) => Promise<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethods?: string[];
}

export function PaymentForm({ invoiceId, remainingBalance, onSubmit, open, onOpenChange, paymentMethods }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amount, setAmount] = useState(remainingBalance);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setPaymentMethod("CASH"); setAmount(remainingBalance); setNotes(""); }
  }, [open, remainingBalance]);

  const handleSubmit = async () => {
    if (amount <= 0) { toast({ title: "Jumlah pembayaran harus lebih dari 0", variant: "destructive" }); return; }
    if (amount > remainingBalance) { toast({ title: "Jumlah pembayaran melebihi sisa tagihan", variant: "destructive" }); return; }
    setLoading(true);
    try { await onSubmit({ paymentMethod, amount, notes: notes || undefined }); onOpenChange(false); }
    catch { toast({ title: "Gagal memproses pembayaran", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const availableMethods = paymentMethods?.length ? paymentMethods : PAYMENT_METHODS.map(m => m.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Proses Pembayaran</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-center">
            <p className="text-sm text-muted-foreground">Sisa Tagihan</p>
            <p className="text-2xl font-bold">{formatCurrency(remainingBalance)}</p>
          </div>
          <div className="space-y-2">
            <Label>Metode Pembayaran <span className="text-destructive">*</span></Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Bayar <span className="text-destructive">*</span></Label>
            <Input id="amount" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} min={0} max={remainingBalance} />
          </div>
          {paymentMethod === "CASH" && amount > 0 && (
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-center">
              <p className="text-sm text-muted-foreground">Kembalian</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(Math.max(0, amount - remainingBalance))}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan pembayaran..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading || amount <= 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Bayar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
