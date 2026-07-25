"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createAppointment, getAvailableSlots } from "@/server/actions/appointments";
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

interface PortalAppointmentFormProps {
  customerId: string;
  pets: { id: string; name: string; species: string }[];
  doctors: { id: string; name: string }[];
}

export function PortalAppointmentForm({ customerId, pets, doctors }: PortalAppointmentFormProps) {
  const router = useRouter();
  const [petId, setPetId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !appointmentDate) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    setTime("");
    try {
      const result = await getAvailableSlots(doctorId, appointmentDate);
      if (result.success && result.data) {
        setAvailableSlots(result.data);
      } else {
        setAvailableSlots([]);
        if (!result.success) {
          setError(result.error.message || "Gagal memuat slot waktu");
        }
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, appointmentDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("customerId", customerId);
      formData.set("petId", petId);
      formData.set("doctorId", doctorId);
      formData.set("appointmentDate", appointmentDate);
      formData.set("time", time);
      if (type) formData.set("type", type);
      if (notes) formData.set("notes", notes);

      const result = await createAppointment(null, formData);
      if (result.success) {
        router.push("/portal/appointments");
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label>Pilih Hewan *</Label>
        <Select value={petId} onValueChange={setPetId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih hewan" />
          </SelectTrigger>
          <SelectContent>
            {pets.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Pilih Dokter *</Label>
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih dokter" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                Dr. {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointmentDate">Pilih Tanggal *</Label>
        <Input
          id="appointmentDate"
          type="date"
          min={today}
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Pilih Jam *</Label>
        {loadingSlots ? (
          <p className="text-sm text-muted-foreground">Memuat slot waktu...</p>
        ) : availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {doctorId && appointmentDate
              ? "Tidak ada slot tersedia pada tanggal ini"
              : "Pilih dokter dan tanggal terlebih dahulu"}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  time === slot
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Jenis Kunjungan</Label>
        <Input
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Contoh: Konsultasi, Vaksinasi"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan tambahan"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting || !time}>
          {submitting ? "Membuat..." : "Buat Janji Temu"}
        </Button>
      </div>
    </form>
  );
}
