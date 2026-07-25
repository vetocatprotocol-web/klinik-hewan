"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createAppointment, getAvailableSlots } from "@/server/actions/appointments";
import { fetchCustomers, fetchUsers } from "@/server/actions/queries";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

type Customer = any;
type Doctor = any;

export default function NewAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const filteredCustomer = customers.find((c) => c.id === selectedCustomerId);
  const pets = filteredCustomer?.pets ?? [];

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await createAppointment(_prev, formData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Janji temu berhasil dibuat" });
        router.push("/appointments");
      } else {
        toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
      }
      return result;
    },
    null
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [customerResult, userResult] = await Promise.all([
          fetchCustomers({ page: 1, search: "" }),
          fetchUsers({ page: 1, search: "" }),
        ]);
        const activeCustomers = customerResult.data.filter((c: any) => c.status === "ACTIVE");
        const activeDoctors = userResult.data.filter((u: any) => u.role === "DOKTER" && u.status === "ACTIVE");
        setCustomers(activeCustomers);
        setDoctors(activeDoctors);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      if (!selectedDoctorId || !selectedDate) {
        setAvailableSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const result = await getAvailableSlots(selectedDoctorId, selectedDate);
        if (result.success) {
          setAvailableSlots(result.data);
        } else {
          setAvailableSlots([]);
        }
      } catch {
        setAvailableSlots([]);
      }
      setLoadingSlots(false);
    }
    loadSlots();
  }, [selectedDoctorId, selectedDate]);

  const appointmentTypes = [
    "KONSULTASI",
    "VAKSINASI",
    "GROOMING",
    "OPERASI",
    "KONTROL",
    "LABORATORIUM",
    "LAINNYA",
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/appointments" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Janji Temu</h1>
          <p className="text-sm text-muted-foreground">
            Isi data janji temu baru
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Janji Temu</CardTitle>
          <CardDescription>
            Lengkapi informasi janji temu di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="customerId" value={selectedCustomerId} />
            <input type="hidden" name="petId" value={pets.find((p: any) => true)?.id ?? ""} />
            <input type="hidden" name="doctorId" value={selectedDoctorId} />
            <input type="hidden" name="appointmentDate" value={selectedDate} />
            <input type="hidden" name="time" value={selectedTime} />
            <input type="hidden" name="type" value={selectedType} />
            <input type="hidden" name="notes" value={notes} />

            <div className="space-y-2">
              <Label>Pelanggan *</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerId && pets.length > 0 && (
              <div className="space-y-2">
                <Label>Hewan *</Label>
                <Select value={pets[0]?.id ?? ""} onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hewan" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.species})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Dokter *</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dokter" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Waktu *</Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground h-10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat slot...
                  </div>
                ) : (
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih waktu" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jenis Janji Temu</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/appointments" className={cn(buttonVariants({ variant: "outline" }))}>
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
