"use client";

import { useState, useEffect } from "react";
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
import { hotelBookingSchema } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type HotelBookingFormData = z.infer<typeof hotelBookingSchema>;

interface HotelBookingFormProps {
  customers: Array<{ id: string; name: string; pets: Array<{ id: string; name: string; species: string }> }>;
  rooms: Array<{ id: string; name: string; type: string; dailyRate: number; status: string }>;
  onSubmit: (data: HotelBookingFormData) => Promise<any>;
  initialData?: any;
  mode: "create" | "edit";
}

export function HotelBookingForm({ customers, rooms, onSubmit, initialData, mode }: HotelBookingFormProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.customerId || "");
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<HotelBookingFormData>({
    resolver: zodResolver(hotelBookingSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      petId: initialData?.petId || "",
      roomId: initialData?.roomId || "",
      checkInDate: initialData?.checkInDate || "",
      checkOutDate: initialData?.checkOutDate || "",
      notes: initialData?.notes || "",
    },
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedRoom = rooms.find(r => r.id === watch("roomId"));
  const checkIn = watch("checkInDate");
  const checkOut = watch("checkOutDate");

  const totalDays = checkIn && checkOut 
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const estimatedTotal = totalDays * (selectedRoom?.dailyRate || 0);

  const availableRooms = rooms.filter(r => r.status === "AVAILABLE");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{mode === "create" ? "Buat Booking Hotel" : "Edit Booking Hotel"}</CardTitle></CardHeader>
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
              <Label>Kamar <span className="text-destructive">*</span></Label>
              <Select value={watch("roomId")} onValueChange={(v) => setValue("roomId", v)}>
                <SelectTrigger><SelectValue placeholder="Pilih kamar" /></SelectTrigger>
                <SelectContent>
                  {availableRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.type}) - {formatCurrency(r.dailyRate)}/hari</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roomId && <p className="text-sm text-destructive">{errors.roomId.message}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tanggal Check-in <span className="text-destructive">*</span></Label>
                <Input type="date" {...register("checkInDate")} />
                {errors.checkInDate && <p className="text-sm text-destructive">{errors.checkInDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tanggal Check-out <span className="text-destructive">*</span></Label>
                <Input type="date" {...register("checkOutDate")} />
                {errors.checkOutDate && <p className="text-sm text-destructive">{errors.checkOutDate.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea {...register("notes")} placeholder="Catatan booking..." />
            </div>
            {totalDays > 0 && selectedRoom && (
              <div className="rounded-md bg-muted p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Durasi</span><span>{totalDays} hari</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tarif/Hari</span><span>{formatCurrency(selectedRoom.dailyRate)}</span></div>
                <div className="flex justify-between font-bold"><span>Total Estimasi</span><span>{formatCurrency(estimatedTotal)}</span></div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Buat Booking" : "Update Booking"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
