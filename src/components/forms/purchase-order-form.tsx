"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface POItem {
  itemType: "PRODUCT" | "DRUG";
  itemId: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrderFormProps {
  supplierId: string;
  products: Array<{ id: string; name: string; price: number }>;
  drugs: Array<{ id: string; name: string; pricePerUnit: number; unit: string }>;
  onSubmit: (data: { items: POItem[]; requiredDate?: string; notes?: string }) => Promise<any>;
}

export function PurchaseOrderForm({ supplierId, products, drugs, onSubmit }: PurchaseOrderFormProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<POItem[]>([]);
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const addItem = (itemType: "PRODUCT" | "DRUG") => {
    setItems([...items, { itemType, itemId: "", quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === "itemId" && value) {
      const list = updated[index].itemType === "PRODUCT" ? products : drugs;
      const found = list.find((i: any) => i.id === value);
      if (found) {
        updated[index].unitPrice = updated[index].itemType === "PRODUCT" ? (found as any).price : (found as any).pricePerUnit;
      }
    }
    setItems(updated);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = async () => {
    if (items.length === 0) { toast({ title: "Tambahkan minimal 1 item", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await onSubmit({ items, requiredDate: requiredDate || undefined, notes: notes || undefined });
      toast({ title: "PO berhasil dibuat" });
    } catch {
      toast({ title: "Gagal membuat PO", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
            <p className="text-center text-muted-foreground py-8">Belum ada item</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 items-end grid-cols-[120px_1fr_80px_120px_40px]">
                  <Select value={item.itemType} onValueChange={(v) => updateItem(index, "itemType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Produk</SelectItem>
                      <SelectItem value="DRUG">Obat</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={item.itemId} onValueChange={(v) => updateItem(index, "itemId", v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih item" /></SelectTrigger>
                    <SelectContent>
                      {(item.itemType === "PRODUCT" ? products : drugs).map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                  <Input type="number" value={item.unitPrice} onChange={e => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)} />
                  <Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div className="mt-4 flex justify-end">
              <p className="text-lg font-bold">Total: {formatCurrency(totalAmount)}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Diperlukan</Label>
          <Input type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan PO..." />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading || items.length === 0}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Buat PO
        </Button>
      </div>
    </div>
  );
}
