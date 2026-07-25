"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { updateSupplier } from "@/server/actions/suppliers";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

type SupplierData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  contactPerson: string | null;
  paymentTerms: string | null;
  specialization: string | null;
};

interface EditSupplierPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSupplierPage({ params }: EditSupplierPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { id } = await params;
      try {
        const { getSupplierById } = await import("@/server/actions/suppliers");
        const data = await getSupplierById(id);
        if (data) {
          setSupplier(data);
        } else {
          toast({ title: "Gagal", description: "Supplier tidak ditemukan", variant: "destructive" });
          router.push("/suppliers");
        }
      } catch {
        toast({ title: "Gagal", description: "Gagal memuat data supplier", variant: "destructive" });
        router.push("/suppliers");
      }
      setLoading(false);
    }
    load();
  }, [params, router, toast]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      if (!supplier) return _prev;
      const result = await updateSupplier(supplier.id, _prev, formData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Supplier berhasil diubah" });
        router.push(`/suppliers/${supplier.id}`);
      } else {
        toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
      }
      return result;
    },
    null
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/suppliers/${supplier.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ubah Supplier</h1>
          <p className="text-sm text-muted-foreground">
            Ubah data supplier
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
          <CardTitle>Data Supplier</CardTitle>
          <CardDescription>
            Lengkapi informasi supplier di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input id="name" name="name" defaultValue={supplier.name} placeholder="Nama supplier" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input id="phone" name="phone" defaultValue={supplier.phone ?? ""} placeholder="08xxxxxxxxxx" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={supplier.email ?? ""} placeholder="email@contoh.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea id="address" name="address" defaultValue={supplier.address ?? ""} placeholder="Alamat lengkap" rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input id="city" name="city" defaultValue={supplier.city ?? ""} placeholder="Nama kota" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Kode Pos</Label>
                <Input id="postalCode" name="postalCode" defaultValue={supplier.postalCode ?? ""} placeholder="12345" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Kontak Person</Label>
              <Input id="contactPerson" name="contactPerson" defaultValue={supplier.contactPerson ?? ""} placeholder="Nama kontak person" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Syarat Pembayaran</Label>
              <Input id="paymentTerms" name="paymentTerms" defaultValue={supplier.paymentTerms ?? ""} placeholder="Contoh: NET 30, COD" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Spesialisasi</Label>
              <Input id="specialization" name="specialization" defaultValue={supplier.specialization ?? ""} placeholder="Contoh: Obat Hewan, Makanan" />
            </div>

            <div className="flex justify-end gap-2">
              <Link href={`/suppliers/${supplier.id}`} className={cn(buttonVariants({ variant: "outline" }))}>
                Batal
              </Link>
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
