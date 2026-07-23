"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/lib/validators";
import { updateCustomer } from "@/server/actions/customers";
import { getCustomerById } from "@/server/queries/customers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

type CustomerFormData = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
};

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const data = await getCustomerById(id);
        if (data) {
          setCustomer(data as CustomerData);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await updateCustomer(id, _prev, formData);
      if (result.success) {
        router.push(`/customers/${id}`);
      }
      return result;
    },
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    values: customer
      ? {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || "",
          address: customer.address || "",
          city: customer.city || "",
          postalCode: customer.postalCode || "",
          notes: customer.notes || "",
        }
      : undefined,
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Pelanggan tidak ditemukan</p>
          <Link href="/customers" className={cn(buttonVariants({ variant: "link" }))}>
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ubah Pelanggan</h1>
          <p className="text-sm text-muted-foreground">
            Perbarui data pelanggan
          </p>
        </div>
      </div>

      {state && !state.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.error.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Pelanggan</CardTitle>
          <CardDescription>
            Perbarui informasi pelanggan di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input id="name" {...register("name")} placeholder="Nama pelanggan" />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telepon *</Label>
                <Input id="phone" {...register("phone")} placeholder="08xxxxxxxxxx" />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@example.com" />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" {...register("address")} placeholder="Alamat lengkap" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input id="city" {...register("city")} placeholder="Nama kota" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Kode Pos</Label>
                <Input id="postalCode" {...register("postalCode")} placeholder="XXXXXX" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input id="notes" {...register("notes")} placeholder="Catatan tambahan" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
