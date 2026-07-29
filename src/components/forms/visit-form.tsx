"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { visitFormSchema } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2 } from "lucide-react";

type VisitFormData = z.infer<typeof visitFormSchema>;

interface VisitFormProps {
  customers: Array<{ id: string; name: string; pets: Array<{ id: string; name: string; species: string }> }>;
  services: Array<{ id: string; name: string; price: number; category: string }>;
  drugs: Array<{ id: string; name: string; pricePerUnit: number; unit: string }>;
  onSubmit: (data: VisitFormData) => Promise<any>;
  initialData?: any;
  mode: "create" | "edit";
}

export function VisitForm({ customers, services, drugs, onSubmit, initialData, mode }: VisitFormProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.customerId || "");
  
  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      petId: initialData?.petId || "",
      chiefComplaint: initialData?.chiefComplaint || "",
      diagnosis: initialData?.diagnosis || "",
      physicalExamNotes: initialData?.physicalExamNotes || "",
      treatmentNotes: initialData?.treatmentNotes || "",
      weightKg: initialData?.weightKg || undefined,
      temperature: initialData?.temperature || undefined,
      heartRate: initialData?.heartRate || undefined,
      visitItems: initialData?.visitItems || [],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: "visitItems" });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const addServiceItem = () => {
    appendItem({ itemType: "SERVICE", serviceId: "", drugId: undefined, quantity: 1, unitPrice: 0, dosage: undefined, durationDays: undefined, instructions: undefined, notes: undefined });
  };

  const addDrugItem = () => {
    appendItem({ itemType: "DRUG", serviceId: undefined, drugId: "", quantity: 1, unitPrice: 0, dosage: "", durationDays: undefined, instructions: "", notes: undefined });
  };

  const totalAmount = itemFields.reduce((sum, field, index) => {
    const item = watch(`visitItems.${index}`);
    return sum + ((item?.quantity || 0) * (item?.unitPrice || 0));
  }, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informasi Kunjungan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pelanggan <span className="text-destructive">*</span></Label>
              <Select value={watch("customerId")} onValueChange={(v) => { setValue("customerId", v); setSelectedCustomerId(v); setValue("petId", ""); }}>
                <SelectTrigger><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hewan <span className="text-destructive">*</span></Label>
              <Select value={watch("petId")} onValueChange={(v) => setValue("petId", v)} disabled={!selectedCustomerId}>
                <SelectTrigger><SelectValue placeholder="Pilih hewan" /></SelectTrigger>
                <SelectContent>
                  {selectedCustomer?.pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.species})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Keluhan Utama <span className="text-destructive">*</span></Label>
            <Textarea {...register("chiefComplaint")} placeholder="Keluhan utama pasien..." />
          </div>
          <div className="space-y-2">
            <Label>Diagnosa <span className="text-destructive">*</span></Label>
            <Textarea {...register("diagnosis")} placeholder="Diagnosa..." />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Berat (kg)</Label>
              <Input type="number" step="0.1" {...register("weightKg", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Suhu (°C)</Label>
              <Input type="number" step="0.1" {...register("temperature", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Detak Jantung</Label>
              <Input type="number" {...register("heartRate", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catatan Pemeriksaan Fisik</Label>
            <Textarea {...register("physicalExamNotes")} placeholder="Hasil pemeriksaan fisik..." />
          </div>
          <div className="space-y-2">
            <Label>Catatan Perawatan</Label>
            <Textarea {...register("treatmentNotes")} placeholder="Rencana perawatan..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Item Kunjungan</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addServiceItem}><Plus className="mr-1 h-4 w-4" />Layanan</Button>
            <Button size="sm" variant="outline" onClick={addDrugItem}><Plus className="mr-1 h-4 w-4" />Obat</Button>
          </div>
        </CardHeader>
        <CardContent>
          {itemFields.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada item. Tambahkan layanan atau obat.</p>
          ) : (
            <div className="space-y-4">
              {itemFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={watch(`visitItems.${index}.itemType`) === "SERVICE" ? "default" : "secondary"}>
                      {watch(`visitItems.${index}.itemType`) === "SERVICE" ? "Layanan" : "Obat"}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  {watch(`visitItems.${index}.itemType`) === "SERVICE" ? (
                    <div className="grid gap-3 md:grid-cols-[1fr_80px_120px]">
                      <Select value={watch(`visitItems.${index}.serviceId`)} onValueChange={(v) => {
                        setValue(`visitItems.${index}.serviceId`, v);
                        const svc = services.find(s => s.id === v);
                        if (svc) setValue(`visitItems.${index}.unitPrice`, svc.price);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Pilih layanan" /></SelectTrigger>
                        <SelectContent>
                          {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={1} {...register(`visitItems.${index}.quantity`, { valueAsNumber: true })} placeholder="Qty" />
                      <Input type="number" {...register(`visitItems.${index}.unitPrice`, { valueAsNumber: true })} placeholder="Harga" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_80px_120px]">
                        <Select value={watch(`visitItems.${index}.drugId`)} onValueChange={(v) => {
                          setValue(`visitItems.${index}.drugId`, v);
                          const drug = drugs.find(d => d.id === v);
                          if (drug) setValue(`visitItems.${index}.unitPrice`, drug.pricePerUnit);
                        }}>
                          <SelectTrigger><SelectValue placeholder="Pilih obat" /></SelectTrigger>
                          <SelectContent>
                            {drugs.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} ({d.unit}) - {formatCurrency(d.pricePerUnit)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" min={1} {...register(`visitItems.${index}.quantity`, { valueAsNumber: true })} placeholder="Qty" />
                        <Input type="number" {...register(`visitItems.${index}.unitPrice`, { valueAsNumber: true })} placeholder="Harga" />
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input {...register(`visitItems.${index}.dosage`)} placeholder="Dosis" />
                        <Input type="number" {...register(`visitItems.${index}.durationDays`, { valueAsNumber: true })} placeholder="Durasi (hari)" />
                        <Input {...register(`visitItems.${index}.instructions`)} placeholder="Instruksi" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {itemFields.length > 0 && (
            <div className="mt-4 flex justify-end">
              <p className="text-lg font-bold">Subtotal: {formatCurrency(totalAmount)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit(async (data) => { await onSubmit(data); })} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Simpan Kunjungan" : "Update Kunjungan"}
        </Button>
      </div>
    </div>
  );
}
