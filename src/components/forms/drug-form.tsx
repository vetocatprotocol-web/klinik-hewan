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
import { drugSchema } from "@/lib/validators";
import { DRUG_UNITS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

type DrugFormData = z.infer<typeof drugSchema>;

interface DrugFormProps {
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    unit?: string;
    pricePerUnit?: number;
    costPerUnit?: number;
    minimumStock?: number;
    supplierId?: string;
  };
  onSubmit: (data: any) => Promise<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers?: Array<{ id: string; name: string }>;
}

export function DrugForm({ initialData, onSubmit, open, onOpenChange, suppliers = [] }: DrugFormProps) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<DrugFormData>({
    resolver: zodResolver(drugSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      unit: (initialData?.unit as any) || "TABLET",
      pricePerUnit: initialData?.pricePerUnit || 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name || "",
        description: initialData?.description || "",
        unit: (initialData?.unit as any) || "TABLET",
        pricePerUnit: initialData?.pricePerUnit || 0,
      });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: DrugFormData) => {
    const payload = {
      ...data,
      costPerUnit: initialData?.costPerUnit,
      minimumStock: initialData?.minimumStock,
      supplierId: initialData?.supplierId,
    };
    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit Obat" : "Tambah Obat"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama <span className="text-destructive">*</span></Label>
            <Input id="name" {...register("name")} placeholder="Nama obat" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register("description")} placeholder="Deskripsi obat" />
          </div>
          <div className="space-y-2">
            <Label>Satuan <span className="text-destructive">*</span></Label>
            <Select value={watch("unit")} onValueChange={(v) => setValue("unit", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DRUG_UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerUnit">Harga per Satuan <span className="text-destructive">*</span></Label>
            <Input id="pricePerUnit" type="number" step="100" {...register("pricePerUnit", { valueAsNumber: true })} />
            {errors.pricePerUnit && <p className="text-sm text-destructive">{errors.pricePerUnit.message}</p>}
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
