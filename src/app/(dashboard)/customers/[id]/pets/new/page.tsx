"use client";

import { useActionState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { petSchema } from "@/lib/validators";
import { createPet } from "@/server/actions/pets";
import { SPECIES } from "@/lib/constants";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

type PetFormData = {
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  weightKg?: number;
  colorMarking?: string;
  medicalHistoryNotes?: string;
};

export default function NewPetPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await createPet(customerId, _prev, formData);
      if (result.success) {
        router.push(`/customers/${customerId}`);
      }
      return result;
    },
    null
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema) as any,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${customerId}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Hewan</h1>
          <p className="text-sm text-muted-foreground">
            Tambahkan hewan baru untuk pelanggan ini
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
          <CardTitle>Data Hewan</CardTitle>
          <CardDescription>
            Lengkapi informasi hewan di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input id="name" {...register("name")} placeholder="Nama hewan" />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Jenis Hewan *</Label>
                <Select
                  value={watch("species") || ""}
                  onValueChange={(value) => setValue("species", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.species && (
                  <p className="text-xs text-destructive">{errors.species.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Ras</Label>
              <Input id="breed" {...register("breed")} placeholder="Ras hewan" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input id="birthDate" type="date" {...register("birthDate")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Berat (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  {...register("weightKg", { valueAsNumber: true })}
                  placeholder="0.0"
                />
                {errors.weightKg && (
                  <p className="text-xs text-destructive">{errors.weightKg.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorMarking">Warna / Tanda Khusus</Label>
              <Input id="colorMarking" {...register("colorMarking")} placeholder="Deskripsi warna atau tanda" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistoryNotes">Riwayat Medis</Label>
              <Input id="medicalHistoryNotes" {...register("medicalHistoryNotes")} placeholder="Riwayat medis hewan" />
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
