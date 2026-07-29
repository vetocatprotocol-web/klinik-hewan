"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supplierSchema } from "@/lib/validators";
import { Loader2 } from "lucide-react";

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  initialData?: { id?: string; name?: string; phone?: string; email?: string; address?: string; city?: string; postalCode?: string; contactPerson?: string; paymentTerms?: string; specialization?: string; };
  onSubmit: (data: SupplierFormData) => Promise<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierForm({ initialData, onSubmit, open, onOpenChange }: SupplierFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: { name: initialData?.name || "", phone: initialData?.phone || "", email: initialData?.email || "", address: initialData?.address || "", city: initialData?.city || "", postalCode: initialData?.postalCode || "", contactPerson: initialData?.contactPerson || "", paymentTerms: initialData?.paymentTerms || "", specialization: initialData?.specialization || "" },
  });

  useEffect(() => {
    if (open) reset({ name: initialData?.name || "", phone: initialData?.phone || "", email: initialData?.email || "", address: initialData?.address || "", city: initialData?.city || "", postalCode: initialData?.postalCode || "", contactPerson: initialData?.contactPerson || "", paymentTerms: initialData?.paymentTerms || "", specialization: initialData?.specialization || "" });
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: SupplierFormData) => { await onSubmit(data); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initialData?.id ? "Edit Supplier" : "Tambah Supplier"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Nama <span className="text-destructive">*</span></Label><Input id="name" {...register("name")} placeholder="Nama supplier" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="phone">Telepon</Label><Input id="phone" {...register("phone")} placeholder="Nomor telepon" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register("email")} placeholder="Email" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="address">Alamat</Label><Textarea id="address" {...register("address")} placeholder="Alamat lengkap" /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="city">Kota</Label><Input id="city" {...register("city")} placeholder="Kota" /></div>
            <div className="space-y-2"><Label htmlFor="postalCode">Kode Pos</Label><Input id="postalCode" {...register("postalCode")} placeholder="Kode pos" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="contactPerson">Kontak Person</Label><Input id="contactPerson" {...register("contactPerson")} placeholder="Nama kontak person" /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="paymentTerms">Syarat Pembayaran</Label><Input id="paymentTerms" {...register("paymentTerms")} placeholder="Contoh: Net 30" /></div>
            <div className="space-y-2"><Label htmlFor="specialization">Spesialisasi</Label><Input id="specialization" {...register("specialization")} placeholder="Contoh: Obat hewan" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
