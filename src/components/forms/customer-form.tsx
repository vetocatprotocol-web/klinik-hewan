"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { customerSchema } from "@/lib/validators";
import { createCustomer, updateCustomer } from "@/server/actions/customers";
import { Loader2 } from "lucide-react";

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  };
  onSuccess?: () => void;
  mode: "create" | "edit";
}

export function CustomerForm({ initialData, onSuccess, mode }: CustomerFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      postalCode: initialData?.postalCode || "",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      try {
        let result;
        if (mode === "create") {
          result = await createCustomer(null, formData);
        } else {
          result = await updateCustomer(initialData!.id!, null, formData);
        }

        if (result?.success === false) {
          setServerError(result.error?.message || "Terjadi kesalahan");
          toast({ title: "Gagal", description: result.error?.message, variant: "destructive" });
        } else {
          toast({ title: mode === "create" ? "Pelanggan berhasil dibuat" : "Pelanggan berhasil diupdate" });
          onSuccess?.();
        }
      } catch {
        toast({ title: "Terjadi kesalahan", variant: "destructive" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Tambah Pelanggan" : "Edit Pelanggan"}</CardTitle>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama <span className="text-destructive">*</span></Label>
              <Input id="name" {...register("name")} placeholder="Nama pelanggan" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon <span className="text-destructive">*</span></Label>
              <Input id="phone" {...register("phone")} placeholder="Nomor telepon" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="Email (opsional, untuk portal)" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat <span className="text-destructive">*</span></Label>
            <Textarea id="address" {...register("address")} placeholder="Alamat lengkap" />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Kota</Label>
              <Input id="city" {...register("city")} placeholder="Kota" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Kode Pos</Label>
              <Input id="postalCode" {...register("postalCode")} placeholder="Kode pos" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" {...register("notes")} placeholder="Catatan tambahan" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Simpan" : "Update"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
