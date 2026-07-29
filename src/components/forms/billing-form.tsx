"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { billingSchema } from "@/lib/validators";
import { Loader2 } from "lucide-react";

type BillingFormData = z.infer<typeof billingSchema>;

interface BillingFormProps {
  customers: Array<{ id: string; name: string; pets: Array<{ id: string; name: string; species: string }> }>;
  onSubmit: (data: BillingFormData) => Promise<any>;
  initialData?: any;
  mode: "create" | "edit";
}

export function BillingForm({ customers, onSubmit, initialData, mode }: BillingFormProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.customerId || "");
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      petId: initialData?.petId || "",
      notes: initialData?.notes || "",
    },
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Buat Billing Baru" : "Edit Billing"}</CardTitle>
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
              <Select value={watch("petId")} onValueChange={(v) => setValue("petId", v)} disabled={!selectedCustomerId}>
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
            <Label>Catatan</Label>
            <Textarea {...register("notes")} placeholder="Catatan billing (rawat inap)..." />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Buat Billing" : "Update Billing"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
