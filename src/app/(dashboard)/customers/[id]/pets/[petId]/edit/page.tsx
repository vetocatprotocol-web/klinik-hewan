"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { petSchema } from "@/lib/validators";
import { updatePet } from "@/server/actions/pets";
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
import { Skeleton } from "@/components/ui/skeleton";
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

interface PetData {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weightKg: number | null;
  colorMarking: string | null;
  medicalHistoryNotes: string | null;
  customerId: string;
}

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const petId = params.petId as string;

  const [pet, setPet] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPet() {
      try {
        const { fetchCustomerById } = await import("@/server/actions/queries");
        const customer = await fetchCustomerById(customerId);
        if (customer) {
          const foundPet = customer.pets.find((p: any) => p.id === petId);
          if (foundPet) {
            setPet({
              id: foundPet.id,
              name: foundPet.name,
              species: foundPet.species,
              breed: foundPet.breed,
              birthDate: foundPet.birthDate ? new Date(foundPet.birthDate).toISOString().split("T")[0] : null,
              weightKg: foundPet.weightKg ? Number(foundPet.weightKg) : null,
              colorMarking: foundPet.colorMarking,
              medicalHistoryNotes: foundPet.medicalHistoryNotes,
              customerId,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPet();
  }, [customerId, petId]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await updatePet(petId, _prev, formData);
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
    values: pet
      ? {
          name: pet.name,
          species: pet.species,
          breed: pet.breed || "",
          birthDate: pet.birthDate || "",
          weightKg: pet.weightKg || undefined,
          colorMarking: pet.colorMarking || "",
          medicalHistoryNotes: pet.medicalHistoryNotes || "",
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Hewan tidak ditemukan</p>
          <Link href={`/customers/${customerId}`} className={cn(buttonVariants({ variant: "link" }))}>
            Kembali ke pelanggan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${customerId}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ubah Hewan</h1>
          <p className="text-sm text-muted-foreground">
            Perbarui data hewan
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
            Perbarui informasi hewan di bawah ini
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
