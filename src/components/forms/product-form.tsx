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
import { productSchema } from "@/lib/validators";
import { Loader2 } from "lucide-react";

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: {
    id?: string;
    name?: string;
    categoryId?: string;
    price?: number;
    description?: string;
    barcode?: string;
    currentStock?: number;
    reorderPoint?: number;
  };
  onSubmit: (data: any) => Promise<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Array<{ id: string; name: string }>;
}

export function ProductForm({ initialData, onSubmit, open, onOpenChange, categories = [] }: ProductFormProps) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      categoryId: initialData?.categoryId || "",
      price: initialData?.price || 0,
      description: initialData?.description || "",
      barcode: initialData?.barcode || "",
      currentStock: initialData?.currentStock || 0,
      reorderPoint: initialData?.reorderPoint || 10,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name || "",
        categoryId: initialData?.categoryId || "",
        price: initialData?.price || 0,
        description: initialData?.description || "",
        barcode: initialData?.barcode || "",
        currentStock: initialData?.currentStock || 0,
        reorderPoint: initialData?.reorderPoint || 10,
      });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama <span className="text-destructive">*</span></Label>
            <Input id="name" {...register("name")} placeholder="Nama produk" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Kategori <span className="text-destructive">*</span></Label>
            <Select value={watch("categoryId")} onValueChange={(v) => setValue("categoryId", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Harga <span className="text-destructive">*</span></Label>
            <Input id="price" type="number" step="100" {...register("price", { valueAsNumber: true })} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input id="reorderPoint" type="number" {...register("reorderPoint", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" {...register("barcode")} placeholder="Barcode (opsional)" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register("description")} placeholder="Deskripsi produk" />
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
