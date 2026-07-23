"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePet } from "@/server/actions/pets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SPECIES } from "@/lib/constants";

interface PetEditFormProps {
  petId: string;
  initialData: {
    name: string;
    species: string;
    breed: string;
    birthDate: string;
    weightKg: string;
    colorMarking: string;
    medicalHistoryNotes: string;
  };
}

export function PortalPetEditForm({ petId, initialData }: PetEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData.name);
  const [species, setSpecies] = useState(initialData.species);
  const [breed, setBreed] = useState(initialData.breed);
  const [birthDate, setBirthDate] = useState(initialData.birthDate);
  const [weightKg, setWeightKg] = useState(initialData.weightKg);
  const [colorMarking, setColorMarking] = useState(initialData.colorMarking);
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState(
    initialData.medicalHistoryNotes
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("species", species);
      if (breed) formData.set("breed", breed);
      if (birthDate) formData.set("birthDate", birthDate);
      if (weightKg) formData.set("weightKg", weightKg);
      if (colorMarking) formData.set("colorMarking", colorMarking);
      if (medicalHistoryNotes) formData.set("medicalHistoryNotes", medicalHistoryNotes);

      const result = await updatePet(petId, null, formData);
      if (result.success) {
        router.push(`/portal/pets/${petId}`);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="name">Nama *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Jenis *</Label>
        <Select value={species} onValueChange={setSpecies}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis hewan" />
          </SelectTrigger>
          <SelectContent>
            {SPECIES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="breed">Ras</Label>
        <Input
          id="breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthDate">Tanggal Lahir</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightKg">Berat (kg)</Label>
          <Input
            id="weightKg"
            type="number"
            min="0"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="colorMarking">Warna / Tanda Khas</Label>
        <Input
          id="colorMarking"
          value={colorMarking}
          onChange={(e) => setColorMarking(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="medicalHistoryNotes">Riwayat Kesehatan</Label>
        <Textarea
          id="medicalHistoryNotes"
          value={medicalHistoryNotes}
          onChange={(e) => setMedicalHistoryNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
