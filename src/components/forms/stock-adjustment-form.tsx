"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { stockAdjustmentSchema } from "@/lib/validators";
import { STOCK_REASONS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentFormProps {
  products: Array<{ id: string; name: string; currentStock: number }>;
  onSubmit: (data: StockAdjustmentFormData) => Promise<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockAdjustmentForm({ products, onSubmit, open, onOpenChange }: StockAdjustmentFormProps) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema) as any,
    defaultValues: { productId: "", quantity: 0, reason: "OPNAME_ADJUST", notes: "" },
  });

  useEffect(() => {
    if (open) reset({ productId: "", quantity: 0, reason: "OPNAME_ADJUST", notes: "" });
  }, [open, reset]);

  const selectedProduct = products.find(p => p.id === watch("productId"));

  const handleFormSubmit = async (data: StockAdjustmentFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Adjust Stok</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Produk <span className="text-destructive">*</span></Label>
            <Select value={watch("productId")} onValueChange={(v) => setValue("productId", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} (Stok: {p.currentStock})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah <span className="text-destructive">*</span></Label>
              <Input id="quantity" type="number" {...register("quantity", { valueAsNumber: true })} placeholder="+ tambah / - kurang" />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Alasan <span className="text-destructive">*</span></Label>
              <Select value={watch("reason")} onValueChange={(v) => setValue("reason", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STOCK_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Catatan adjustment..." />
          </div>
          {selectedProduct && (
            <p className="text-sm text-muted-foreground">
              Stok saat ini: {selectedProduct.currentStock} | Setelah adjust: {selectedProduct.currentStock + (watch("quantity") || 0)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
