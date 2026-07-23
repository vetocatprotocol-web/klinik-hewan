"use client";

import { useState, useEffect, useCallback } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { billingSchema } from "@/lib/validators";
import { createBilling } from "@/server/actions/billings";
import { fetchSearchCustomers } from "@/server/actions/queries";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  pets: { id: string; name: string; species: string }[];
}

type BillingFormData = {
  customerId: string;
  petId: string;
  notes?: string;
};

export default function NewBillingPage() {
  const router = useRouter();
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const {
    register,
    formState: { errors },
    setValue,
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
  });

  const searchCustomer = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomer(true);
    try {
      const results = await fetchSearchCustomers(query);
      setCustomerResults(results as CustomerOption[]);
    } finally {
      setSearchingCustomer(false);
    }
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

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      formData.set("customerId", selectedCustomer?.id || "");
      formData.set("petId", selectedPetId);
      const result = await createBilling(_prev, formData);
      if (result.success) {
        router.push("/billings");
      }
      return result;
    },
    null
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/billings"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Billing Baru</h1>
          <p className="text-sm text-muted-foreground">
            Buat billing baru
          </p>
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
            <CardDescription>Pilih pelanggan dan hewan</CardDescription>
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
                  {searchingCustomer && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
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

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Catatan tambahan" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Billing
          </Button>
        </div>
      </form>
    </div>
  );
}
