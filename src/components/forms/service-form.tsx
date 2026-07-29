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
import { serviceSchema } from "@/lib/validators";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    price?: number;
  };
  onSubmit: (data: ServiceFormData) => Promise<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceForm({ initialData, onSubmit, open, onOpenChange }: ServiceFormProps) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: (initialData?.category as any) || "KONSULTASI",
      price: initialData?.price || 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name || "",
        description: initialData?.description || "",
        category: (initialData?.category as any) || "KONSULTASI",
        price: initialData?.price || 0,
      });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: ServiceFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama <span className="text-destructive">*</span></Label>
            <Input id="name" {...register("name")} placeholder="Nama layanan" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register("description")} placeholder="Deskripsi layanan" />
          </div>
          <div className="space-y-2">
            <Label>Kategori <span className="text-destructive">*</span></Label>
            <Select value={watch("category")} onValueChange={(v) => setValue("category", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Harga <span className="text-destructive">*</span></Label>
            <Input id="price" type="number" step="100" {...register("price", { valueAsNumber: true })} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
