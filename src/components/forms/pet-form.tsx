"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { petSchema } from "@/lib/validators";
import { createPet, updatePet } from "@/server/actions/pets";
import { SPECIES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

type PetFormData = z.infer<typeof petSchema>;

interface PetFormProps {
  customerId: string;
  initialData?: {
    id?: string;
    name?: string;
    species?: string;
    breed?: string;
    birthDate?: string;
    weightKg?: number;
    colorMarking?: string;
    medicalHistoryNotes?: string;
  };
  onSuccess?: () => void;
  mode: "create" | "edit";
}

export function PetForm({ customerId, initialData, onSuccess, mode }: PetFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: initialData?.name || "",
      species: (initialData?.species as any) || "Anjing",
      breed: initialData?.breed || "",
      birthDate: initialData?.birthDate || "",
      weightKg: initialData?.weightKg || undefined,
      colorMarking: initialData?.colorMarking || "",
      medicalHistoryNotes: initialData?.medicalHistoryNotes || "",
    },
  });

  const onSubmit = (data: PetFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });

      try {
        let result;
        if (mode === "create") {
          result = await createPet(customerId, null, formData);
        } else {
          result = await updatePet(initialData!.id!, null, formData);
        }

        if (result?.success === false) {
          setServerError(result.error?.message || "Terjadi kesalahan");
          toast({ title: "Gagal", description: result.error?.message, variant: "destructive" });
        } else {
          toast({ title: mode === "create" ? "Hewan berhasil dibuat" : "Hewan berhasil diupdate" });
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
        <CardTitle>{mode === "create" ? "Tambah Hewan" : "Edit Hewan"}</CardTitle>
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
              <Input id="name" {...register("name")} placeholder="Nama hewan" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Spesies <span className="text-destructive">*</span></Label>
              <Select value={watch("species")} onValueChange={(v) => setValue("species", v as any)}>
                <SelectTrigger><SelectValue placeholder="Pilih spesies" /></SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.species && <p className="text-sm text-destructive">{errors.species.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="breed">Ras</Label>
              <Input id="breed" {...register("breed")} placeholder="Ras (opsional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Tanggal Lahir</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weightKg">Berat (kg)</Label>
              <Input id="weightKg" type="number" step="0.1" {...register("weightKg", { valueAsNumber: true })} placeholder="Berat dalam kg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorMarking">Warna / Tanda</Label>
              <Input id="colorMarking" {...register("colorMarking")} placeholder="Warna atau tanda khusus" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicalHistoryNotes">Catatan Riwayat Kesehatan</Label>
            <Textarea id="medicalHistoryNotes" {...register("medicalHistoryNotes")} placeholder="Riwayat kesehatan (diisi pemilik)" />
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
