"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/lib/validators";
import { createCustomer } from "@/server/actions/customers";
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

export default function NewCustomerPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await createCustomer(_prev, formData);
      if (result.success) {
        router.push("/customers");
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
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Pelanggan</h1>
          <p className="text-sm text-muted-foreground">
            Isi data pelanggan baru
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
            Lengkapi informasi pelanggan di bawah ini
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
