"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { createPurchaseOrder } from "@/server/actions/suppliers";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currentStock: number;
}

interface Drug {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: string;
}

interface POItem {
  itemType: "PRODUCT" | "DRUG";
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export default function SupplierPONewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [items, setItems] = useState<POItem[]>([]);
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [supplierRes, productsRes, drugsRes] = await Promise.all([
        fetch(`/api/suppliers/${supplierId}`),
        fetch("/api/products?status=ACTIVE"),
        fetch("/api/drugs?status=ACTIVE"),
      ]);
      
      if (supplierRes.ok) {
        const sData = await supplierRes.json();
        setSupplier(sData);
      }
      if (productsRes.ok) {
        const pData = await productsRes.json();
        setProducts(pData.data || pData || []);
      }
      if (drugsRes.ok) {
        const dData = await drugsRes.json();
        setDrugs(dData.data || dData || []);
      }
    } catch {
      toast({ title: "Gagal memuat data", variant: "destructive" });
    } finally {
      setInitialLoading(false);
    }
  }, [supplierId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addItem = (itemType: "PRODUCT" | "DRUG") => {
    setItems([...items, {
      itemType,
      itemId: "",
      itemName: "",
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    
    if (field === "itemId" && value) {
      const list = updated[index].itemType === "PRODUCT" ? products : drugs;
      const found = list.find((i: any) => i.id === value);
      if (found) {
        updated[index].itemName = found.name;
        updated[index].unitPrice = updated[index].itemType === "PRODUCT" 
          ? (found as Product).price 
          : (found as Drug).pricePerUnit;
      }
    }
    
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({ title: "Tambahkan minimal 1 item", variant: "destructive" });
      return;
    }
    if (items.some(i => !i.itemId || i.quantity < 1)) {
      toast({ title: "Lengkapi semua item", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map(i => ({
        productId: i.itemType === "PRODUCT" ? i.itemId : undefined,
        drugId: i.itemType === "DRUG" ? i.itemId : undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));
      const result = await createPurchaseOrder(supplierId, orderItems, notes || undefined);

      if (result.success) {
        toast({ title: "PO berhasil dibuat" });
        router.push(`/suppliers/${supplierId}`);
      } else {
        toast({ title: result.error?.message || "Gagal membuat PO", variant: "destructive" });
      }
    } catch {
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/suppliers/${supplierId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buat Purchase Order</h1>
          <p className="text-muted-foreground">Supplier: {supplier?.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Informasi PO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tanggal Diperlukan</Label>
              <Input type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Total Nilai</Label>
              <Input value={`Rp ${totalAmount.toLocaleString("id-ID")}`} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan untuk PO ini..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Item PO</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addItem("PRODUCT")}><Plus className="mr-1 h-4 w-4" />Produk</Button>
            <Button size="sm" variant="outline" onClick={() => addItem("DRUG")}><Plus className="mr-1 h-4 w-4" />Obat</Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada item. Klik tombol di atas untuk menambah item.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 items-end grid-cols-[150px_1fr_100px_150px_40px]">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipe</Label>
                    <Select value={item.itemType} onValueChange={(v) => updateItem(index, "itemType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Produk</SelectItem>
                        <SelectItem value="DRUG">Obat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Item</Label>
                    <Select value={item.itemId} onValueChange={(v) => updateItem(index, "itemId", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih item..." /></SelectTrigger>
                      <SelectContent>
                        {(item.itemType === "PRODUCT" ? products : drugs).map((i: any) => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Jumlah</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Harga Satuan</Label>
                    <Input type="number" min={0} value={item.unitPrice} onChange={e => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href={`/suppliers/${supplierId}`}><Button variant="outline">Batal</Button></Link>
        <Button onClick={handleSubmit} disabled={loading || items.length === 0}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Buat PO
        </Button>
      </div>
    </div>
  );
}
