"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { processPayment, emailInvoice } from "@/server/actions/invoices";
import { CreditCard, Mail, Loader2 } from "lucide-react";

interface InvoiceActionsProps {
  invoiceId: string;
  remainingBalance: number;
  status: string;
}

export function InvoiceActions({
  invoiceId,
  remainingBalance,
  status,
}: InvoiceActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [paymentState, paymentFormAction, paymentPending] = useActionState(
    processPayment,
    null
  );
  const [emailState, emailFormAction, emailPending] = useActionState(
    emailInvoice,
    null
  );

  if (paymentState?.success) {
    toast({ title: "Pembayaran berhasil", variant: "default" });
    router.refresh();
  } else if (paymentState && !paymentState.success) {
    toast({
      title: "Gagal memproses pembayaran",
      description: paymentState.error.message,
      variant: "destructive",
    });
  }

  if (emailState?.success) {
    toast({ title: "Invoice berhasil dikirim ke email", variant: "default" });
  } else if (emailState && !emailState.success) {
    toast({
      title: "Gagal mengirim email",
      description: emailState.error.message,
      variant: "destructive",
    });
  }

  const isPaid = status === "PAID";

  return (
    <div className="flex gap-2">
      {!isPaid && (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Proses Pembayaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Proses Pembayaran</DialogTitle>
              <DialogDescription>
                Sisa tagihan: Rp {remainingBalance.toLocaleString("id-ID")}
              </DialogDescription>
            </DialogHeader>
            <form action={paymentFormAction} className="space-y-4">
              <input type="hidden" name="invoiceId" value={invoiceId} />
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Tunai</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
                    <SelectItem value="CREDIT_CARD">Kartu Kredit</SelectItem>
                    <SelectItem value="DEBIT_CARD">Kartu Debit</SelectItem>
                    <SelectItem value="QRIS">QRIS</SelectItem>
                    <SelectItem value="OTHER">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Pembayaran</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={1}
                  max={remainingBalance}
                  required
                  placeholder="Masukkan jumlah"
                />
                <p className="text-xs text-muted-foreground">
                  Maksimal: Rp {remainingBalance.toLocaleString("id-ID")}
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={paymentPending}>
                  {paymentPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Proses Pembayaran
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <form action={emailFormAction}>
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <Button type="submit" variant="outline" size="sm" disabled={emailPending}>
          {emailPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Email Invoice
        </Button>
      </form>
    </div>
  );
}
