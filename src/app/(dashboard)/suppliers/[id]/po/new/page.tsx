"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getSupplierById, createPurchaseOrder } from "@/server/actions/suppliers";
import { fetchActiveProducts, fetchActiveDrugs } from "@/server/actions/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

interface SupplierData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
}

interface MasterItem {
  id: string;
  name: string;
  price?: number;
  pricePerUnit?: number;
}

interface POItem {
  itemType: "PRODUCT" | "DRUG";
  itemId: string;
  quantity: number;
  unitPrice: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MasterItem[]>([]);
  const [drugs, setDrugs] = useState<MasterItem[]>([]);
  const [items, setItems] = useState<POItem[]>([
    { itemType: "PRODUCT", itemId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [supplierData, productsData, drugsData] = await Promise.all([
          getSupplierById(supplierId),
          fetchActiveProducts(),
          fetchActiveDrugs(),
        ]);
        setSupplier(supplierData as unknown as SupplierData);
        setProducts(
          (productsData as unknown as MasterItem[]).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
          }))
        );
        setDrugs(
          (drugsData as unknown as MasterItem[]).map((d) => ({
            id: d.id,
            name: d.name,
            pricePerUnit: d.pricePerUnit,
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supplierId]);

  const addItem = () => {
    setItems([...items, { itemType: "PRODUCT", itemId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "itemId") {
      const source = updated[index].itemType === "PRODUCT" ? products : drugs;
      const masterItem = source.find((m) => m.id === value);
      if (masterItem) {
        updated[index].unitPrice = Number(masterItem.price || masterItem.pricePerUnit || 0);
      }
    }
    if (field === "itemType") {
      updated[index].itemId = "";
      updated[index].unitPrice = 0;
    }
    setItems(updated);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((item) => item.itemId && item.quantity > 0);
    if (validItems.length === 0) {
      setError("Minimal satu item harus ditambahkan");
      return;
    }

    setSubmitting(true);
    try {
      const poItems = validItems.map((item) => ({
        productId: item.itemType === "PRODUCT" ? item.itemId : undefined,
        drugId: item.itemType === "DRUG" ? item.itemId : undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      const result = await createPurchaseOrder(supplierId, poItems, notes || undefined);
      if (result.success) {
        router.push(`/suppliers/${supplierId}`);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Supplier tidak ditemukan</p>
        <Link href="/suppliers" className={cn(buttonVariants({ variant: "link" }))}>
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const currentMasterItems = items.map((item) =>
    item.itemType === "PRODUCT" ? products : drugs
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/suppliers/${supplierId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Buat Purchase Order</h1>
          <p className="text-sm text-muted-foreground">
            Supplier: {supplier.name}
          </p>
        </div>
        <StatusBadge status={supplier.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Supplier</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Nama</p>
            <p className="font-medium">{supplier.name}</p>
          </div>
          {supplier.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Telepon</p>
              <p className="font-medium">{supplier.phone}</p>
            </div>
          )}
          {supplier.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{supplier.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Item Purchase Order</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-4 p-4 border rounded-md sm:grid-cols-[150px_1fr_100px_150px_40px]"
              >
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select
                    value={item.itemType}
                    onValueChange={(v) => updateItem(index, "itemType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Produk</SelectItem>
                      <SelectItem value="DRUG">Obat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Item</Label>
                  <Select
                    value={item.itemId}
                    onValueChange={(v) => updateItem(index, "itemId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih item" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentMasterItems[index].map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Harga Satuan</Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, "unitPrice", Number(e.target.value))
                    }
                  />
                </div>
                <div className="flex items-end">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk purchase order"
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Link
                href={`/suppliers/${supplierId}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Batal
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Purchase Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
