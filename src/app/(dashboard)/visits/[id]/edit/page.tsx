"use client";

import { useState, useEffect, useCallback } from "react";
import { useActionState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitFormSchema } from "@/lib/validators";
import { fetchVisitById } from "@/server/actions/queries";
import { fetchSearchCustomers } from "@/server/actions/queries";
import { fetchActiveServices, fetchActiveDrugs } from "@/server/actions/queries";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  pets: { id: string; name: string; species: string }[];
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface DrugOption {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: string;
}

interface SelectedService {
  serviceId: string;
  quantity: number;
}

interface SelectedDrug {
  drugId: string;
  quantity: number;
  dosage: string;
  durationDays: string;
  instructions: string;
}

interface VisitData {
  id: string;
  visitNumber: string;
  status: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  physicalExamNotes: string | null;
  treatmentNotes: string | null;
  weightKg: number | null;
  temperature: number | null;
  heartRate: number | null;
  customerId: string;
  petId: string;
  customer: { id: string; name: string; phone: string; pets: { id: string; name: string; species: string }[] };
  pet: { id: string; name: string; species: string };
  visitItems: {
    id: string;
    itemType: string;
    quantity: number;
    serviceId: string | null;
    drugId: string | null;
  }[];
}

type VisitFormData = {
  customerId: string;
  petId: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  physicalExamNotes?: string;
  treatmentNotes?: string;
  weightKg?: string | number;
  temperature?: string | number;
  heartRate?: string | number;
};

export default function EditVisitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [visit, setVisit] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [drugs, setDrugs] = useState<DrugOption[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<SelectedDrug[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [visitData, servicesData, drugsData] = await Promise.all([
          fetchVisitById(id),
          fetchActiveServices(),
          fetchActiveDrugs(),
        ]);

        if (visitData && visitData.status === "DRAFT") {
          const v = visitData as any;
          setVisit(v);
          setServices(servicesData as unknown as ServiceOption[]);
          setDrugs(drugsData as unknown as DrugOption[]);

          setSelectedCustomer({
            id: v.customer.id,
            name: v.customer.name,
            phone: v.customer.phone,
            pets: v.customer.pets || [],
          });
          setSelectedPetId(v.petId);
          setSelectedServices(
            v.visitItems
              .filter((item: any) => item.itemType === "SERVICE" && item.serviceId)
              .map((item: any) => ({ serviceId: item.serviceId, quantity: item.quantity }))
          );
          setSelectedDrugs(
            v.visitItems
              .filter((item: any) => item.itemType === "DRUG" && item.drugId)
              .map((item: any) => ({
                drugId: item.drugId,
                quantity: item.quantity,
                dosage: item.dosage || "",
                durationDays: item.durationDays ? String(item.durationDays) : "",
                instructions: item.instructions || "",
              }))
          );
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const {
    register,
    formState: { errors },
    setValue,
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
  });

  const searchCustomer = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    const results = await fetchSearchCustomers(query);
    setCustomerResults(results as CustomerOption[]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchCustomer(customerQuery), 300);
    return () => clearTimeout(timer);
  }, [customerQuery, searchCustomer]);

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setCustomerQuery("");
    setCustomerResults([]);
    setSelectedPetId("");
    setValue("customerId", customer.id);
    setValue("petId", "");
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.serviceId === serviceId);
      if (exists) return prev.filter((s) => s.serviceId !== serviceId);
      return [...prev, { serviceId, quantity: 1 }];
    });
  };

  const updateServiceQty = (serviceId: string, quantity: number) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, quantity } : s))
    );
  };

  const toggleDrug = (drugId: string) => {
    setSelectedDrugs((prev) => {
      const exists = prev.find((d) => d.drugId === drugId);
      if (exists) return prev.filter((d) => d.drugId !== drugId);
      return [...prev, { drugId, quantity: 1, dosage: "", durationDays: "", instructions: "" }];
    });
  };

  const updateDrugQty = (drugId: string, quantity: number) => {
    setSelectedDrugs((prev) =>
      prev.map((d) => (d.drugId === drugId ? { ...d, quantity } : d))
    );
  };

  const updateDrugField = (drugId: string, field: string, value: string) => {
    setSelectedDrugs((prev) =>
      prev.map((d) => (d.drugId === drugId ? { ...d, [field]: value } : d))
    );
  };

  const calculateSubtotal = () => {
    let total = 0;
    for (const s of selectedServices) {
      const service = services.find((sv) => sv.id === s.serviceId);
      if (service) total += service.price * s.quantity;
    }
    for (const d of selectedDrugs) {
      const drug = drugs.find((dr) => dr.id === d.drugId);
      if (drug) total += drug.pricePerUnit * d.quantity;
    }
    return total;
  };

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      formData.set("services", JSON.stringify(selectedServices));
      formData.set("drugs", JSON.stringify(selectedDrugs));
      formData.set("customerId", selectedCustomer?.id || "");
      formData.set("petId", selectedPetId);
      const { updateVisit } = await import("@/server/actions/visits");
      const result = await updateVisit(id, _prev, formData);
      if (result.success) {
        router.push(`/visits/${id}`);
      }
      return result;
    },
    null
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
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
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!visit || visit.status !== "DRAFT") {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Kunjungan tidak ditemukan atau sudah selesai</p>
          <Link href="/visits" className={cn(buttonVariants({ variant: "link" }))}>
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/visits/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ubah Kunjungan</h1>
          <p className="text-sm text-muted-foreground">{visit.visitNumber}</p>
        </div>
      </div>

      {state && !state.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.error.message}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="customerId" value={selectedCustomer?.id || ""} />
        <input type="hidden" name="petId" value={selectedPetId} />

        <Card>
          <CardHeader>
            <CardTitle>Pelanggan & Hewan</CardTitle>
            <CardDescription>Pilih pelanggan dan hewan yang datang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pelanggan *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSelectedPetId("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau telepon pelanggan..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    className="pl-9"
                  />
                  {customerResults.length > 0 && (
                    <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <span>{c.name}</span>
                          <span className="text-muted-foreground">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <input type="hidden" {...register("customerId")} />
              {errors.customerId && (
                <p className="text-xs text-destructive">{errors.customerId.message}</p>
              )}
            </div>

            {selectedCustomer && (
              <div className="space-y-2">
                <Label>Hewan *</Label>
                <select
                  value={selectedPetId}
                  onChange={(e) => {
                    setSelectedPetId(e.target.value);
                    setValue("petId", e.target.value);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Pilih hewan</option>
                  {selectedCustomer.pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
                <input type="hidden" {...register("petId")} />
                {errors.petId && (
                  <p className="text-xs text-destructive">{errors.petId.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Kunjungan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Tanggal Kunjungan *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  {...register("visitDate")}
                  defaultValue={visit.visitDate.split("T")[0]}
                />
                {errors.visitDate && (
                  <p className="text-xs text-destructive">{errors.visitDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Keluhan Utama *</Label>
                <Input
                  id="chiefComplaint"
                  {...register("chiefComplaint")}
                  defaultValue={visit.chiefComplaint}
                />
                {errors.chiefComplaint && (
                  <p className="text-xs text-destructive">{errors.chiefComplaint.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Input
                id="diagnosis"
                {...register("diagnosis")}
                defaultValue={visit.diagnosis}
              />
              {errors.diagnosis && (
                <p className="text-xs text-destructive">{errors.diagnosis.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="physicalExamNotes">Catatan Pemeriksaan Fisik</Label>
              <Textarea
                id="physicalExamNotes"
                {...register("physicalExamNotes")}
                defaultValue={visit.physicalExamNotes || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentNotes">Catatan Perawatan</Label>
              <Textarea
                id="treatmentNotes"
                {...register("treatmentNotes")}
                defaultValue={visit.treatmentNotes || ""}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="weightKg">Berat (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  {...register("weightKg")}
                  defaultValue={visit.weightKg || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Suhu (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  {...register("temperature")}
                  defaultValue={visit.temperature || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Detak Jantung</Label>
                <Input
                  id="heartRate"
                  type="number"
                  {...register("heartRate")}
                  defaultValue={visit.heartRate || ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layanan</CardTitle>
            <CardDescription>Pilih layanan yang diberikan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((service) => {
              const isSelected = selectedServices.some((s) => s.serviceId === service.id);
              const selected = selectedServices.find((s) => s.serviceId === service.id);
              return (
                <div key={service.id} className="flex items-center gap-3 rounded-md border p-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.category} - {formatCurrency(service.price)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Qty:</Label>
                      <Input
                        type="number"
                        min={1}
                        value={selected?.quantity || 1}
                        onChange={(e) => updateServiceQty(service.id, Number(e.target.value))}
                        className="h-8 w-16"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obat</CardTitle>
            <CardDescription>Pilih obat yang diberikan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {drugs.map((drug) => {
              const isSelected = selectedDrugs.some((d) => d.drugId === drug.id);
              const selected = selectedDrugs.find((d) => d.drugId === drug.id);
              return (
                <div key={drug.id} className="flex items-center gap-3 rounded-md border p-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleDrug(drug.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{drug.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {drug.unit} - {formatCurrency(drug.pricePerUnit)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-1 space-y-2 mt-2 ml-8">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-16">Qty:</Label>
                        <Input
                          type="number"
                          min={1}
                          value={selected?.quantity || 1}
                          onChange={(e) => updateDrugQty(drug.id, Number(e.target.value))}
                          className="h-8 w-16"
                        />
                        <Label className="text-xs w-16">Dosis:</Label>
                        <Input
                          type="text"
                          value={selected?.dosage || ""}
                          onChange={(e) => updateDrugField(drug.id, "dosage", e.target.value)}
                          className="h-8 flex-1"
                          placeholder="contoh: 1 tablet 3x sehari"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-16">Durasi:</Label>
                        <Input
                          type="number"
                          min={1}
                          value={selected?.durationDays || ""}
                          onChange={(e) => updateDrugField(drug.id, "durationDays", e.target.value)}
                          className="h-8 w-20"
                          placeholder="hari"
                        />
                        <Label className="text-xs w-16">Instruksi:</Label>
                        <Input
                          type="text"
                          value={selected?.instructions || ""}
                          onChange={(e) => updateDrugField(drug.id, "instructions", e.target.value)}
                          className="h-8 flex-1"
                          placeholder="contoh: diminum setelah makan"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
