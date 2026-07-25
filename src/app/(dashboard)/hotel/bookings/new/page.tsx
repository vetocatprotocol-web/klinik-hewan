"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createHotelBooking, getAvailableRooms } from "@/server/actions/hotel";
import { fetchSearchCustomers } from "@/server/actions/queries";
import { useToast } from "@/components/ui/toast";
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
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  pets: { id: string; name: string; species: string }[];
}

interface RoomOption {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  dailyRate: number;
  capacity: number;
}

export default function NewBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [pets, setPets] = useState<{ id: string; name: string; species: string }[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<RoomOption[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await createHotelBooking(_prev, formData);
      if (result.success) {
        toast({ title: "Booking berhasil dibuat", variant: "default" });
        router.push("/hotel");
      } else {
        toast({ title: "Gagal membuat booking", description: result.error.message, variant: "destructive" });
      }
      return result;
    },
    null
  );

  useEffect(() => {
    fetchSearchCustomers("").then((result) => {
      if (Array.isArray(result)) setCustomers(result as unknown as CustomerOption[]);
    });
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find((c) => c.id === selectedCustomer);
      setPets(customer?.pets || []);
      setSelectedPet("");
    }
  }, [selectedCustomer, customers]);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      setLoadingRooms(true);
      getAvailableRooms(checkInDate, checkOutDate).then((result) => {
        if (result.success && result.data) {
          setAvailableRooms(result.data as unknown as RoomOption[]);
        }
        setLoadingRooms(false);
      });
    }
  }, [checkInDate, checkOutDate]);

  const selectedRoomData = availableRooms.find((r) => r.id === selectedRoom);
  const estimatedDays = checkInDate && checkOutDate
    ? Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const estimatedTotal = selectedRoomData && estimatedDays > 0
    ? estimatedDays * Number(selectedRoomData.dailyRate)
    : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/hotel"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Buat Booking Baru</h1>
          <p className="text-sm text-muted-foreground">
            Isi data booking hotel
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Booking</CardTitle>
          <CardDescription>
            Lengkapi informasi booking di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label>Pelanggan *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="customerId" value={selectedCustomer} />
            </div>

            <div className="space-y-2">
              <Label>Hewan *</Label>
              <Select value={selectedPet} onValueChange={setSelectedPet}>
                <SelectTrigger disabled={!selectedCustomer}>
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
              <input type="hidden" name="petId" value={selectedPet} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Tanggal Check In *</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                />
                <input type="hidden" name="checkInDate" value={checkInDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Tanggal Check Out *</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate || undefined}
                  required
                />
                <input type="hidden" name="checkOutDate" value={checkOutDate} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kamar *</Label>
              {loadingRooms ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat kamar tersedia...
                </div>
              ) : !checkInDate || !checkOutDate ? (
                <p className="text-sm text-muted-foreground py-2">
                  Pilih tanggal check-in dan check-out terlebih dahulu
                </p>
              ) : availableRooms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Tidak ada kamar tersedia pada tanggal tersebut
                </p>
              ) : (
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kamar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomNumber} - {room.name} ({room.type}) - {formatCurrency(Number(room.dailyRate))}/hari
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <input type="hidden" name="roomId" value={selectedRoom} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan"
              />
              <input type="hidden" name="notes" value={notes} />
            </div>

            {selectedRoomData && estimatedDays > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kamar</span>
                    <span>{selectedRoomData.roomNumber} - {selectedRoomData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tarif per Hari</span>
                    <span>{formatCurrency(Number(selectedRoomData.dailyRate))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Hari</span>
                    <span>{estimatedDays} hari</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Estimasi Total</span>
                    <span>{formatCurrency(estimatedTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending || !selectedRoom || !selectedCustomer || !selectedPet}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Booking
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
