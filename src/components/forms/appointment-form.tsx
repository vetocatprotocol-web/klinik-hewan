"use client";

import { useState } from "react";
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
import { appointmentSchema } from "@/lib/validators";
import { Loader2 } from "lucide-react";

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  customers: Array<{ id: string; name: string; pets: Array<{ id: string; name: string; species: string }> }>;
  doctors: Array<{ id: string; name: string }>;
  onSubmit: (data: AppointmentFormData) => Promise<any>;
  initialData?: any;
  mode: "create" | "edit";
}

export function AppointmentForm({ customers, doctors, onSubmit, initialData, mode }: AppointmentFormProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.customerId || "");
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      customerId: initialData?.customerId || "",
      petId: initialData?.petId || "",
      doctorId: initialData?.doctorId || "",
      appointmentDate: initialData?.appointmentDate || "",
      time: initialData?.time || "",
      type: initialData?.type || "CHECKUP",
      notes: initialData?.notes || "",
    },
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Buat Janji Temu" : "Edit Janji Temu"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(async (data) => { await onSubmit(data); })} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pelanggan <span className="text-destructive">*</span></Label>
              <Select 
                value={watch("customerId")} 
                onValueChange={(v) => { setValue("customerId", v); setSelectedCustomerId(v); setValue("petId", ""); }}
              >
                <SelectTrigger><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Hewan <span className="text-destructive">*</span></Label>
              <Select value={watch("petId")} onValueChange={(v) => setValue("petId", v)}>
                <SelectTrigger><SelectValue placeholder="Pilih hewan" /></SelectTrigger>
                <SelectContent>
                  {selectedCustomer?.pets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.species})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.petId && <p className="text-sm text-destructive">{errors.petId.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dokter <span className="text-destructive">*</span></Label>
            <Select value={watch("doctorId")} onValueChange={(v) => setValue("doctorId", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih dokter" /></SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>dr. {d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.doctorId && <p className="text-sm text-destructive">{errors.doctorId.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tanggal <span className="text-destructive">*</span></Label>
              <Input type="date" {...register("appointmentDate")} />
              {errors.appointmentDate && <p className="text-sm text-destructive">{errors.appointmentDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Waktu <span className="text-destructive">*</span></Label>
              <Input type="time" {...register("time")} />
              {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKUP">Check-up</SelectItem>
                  <SelectItem value="VACCINATION">Vaksinasi</SelectItem>
                  <SelectItem value="GROOMING">Grooming</SelectItem>
                  <SelectItem value="SURGERY">Operasi</SelectItem>
                  <SelectItem value="FOLLOWUP">Kontrol</SelectItem>
                  <SelectItem value="OTHER">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea {...register("notes")} placeholder="Catatan janji temu..." />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Buat Janji" : "Update Janji"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
