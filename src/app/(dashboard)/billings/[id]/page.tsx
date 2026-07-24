"use client";

import { useState, useEffect, useCallback } from "react";
import { useActionState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchBillingById, fetchActiveServices, fetchActiveDrugs, fetchActiveProducts } from "@/server/actions/queries";
import { addBillingItem, removeBillingItem, completeBilling } from "@/server/actions/billings";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";

interface BillingData {
  id: string;
  billingNumber: string;
  billingStartDate: string;
  billingEndDate: string | null;
  status: string;
  notes: string | null;
  customer: { id: string; name: string; phone: string };
  pet: { id: string; name: string; species: string };
  billingItems: {
    id: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes: string | null;
    service: { name: string } | null;
    drug: { name: string } | null;
    product: { name: string } | null;
  }[];
  invoice: { id: string; invoiceNumber: string; status: string } | null;
}

interface MasterItem {
  id: string;
  name: string;
  price?: number;
  pricePerUnit?: number;
}

export default function BillingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemType, setItemType] = useState("SERVICE");
  const [itemId, setItemId] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [addingItem, setAddingItem] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBillingById(id);
      if (data) {
        setBilling(data as unknown as BillingData);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const loadMasterItems = useCallback(async (type: string) => {
    if (type === "SERVICE") {
      const items = await fetchActiveServices();
      setMasterItems((items as unknown as MasterItem[]).map((i) => ({ id: i.id, name: i.name, price: i.price })));
    } else if (type === "DRUG") {
      const items = await fetchActiveDrugs();
      setMasterItems((items as unknown as MasterItem[]).map((i) => ({ id: i.id, name: i.name, pricePerUnit: i.pricePerUnit })));
    } else if (type === "PRODUCT") {
      const items = await fetchActiveProducts();
      setMasterItems((items as unknown as MasterItem[]).map((i) => ({ id: i.id, name: i.name, price: i.price })));
    }
  }, []);

  useEffect(() => {
    if (itemDialogOpen) {
      loadMasterItems(itemType);
    }
  }, [itemDialogOpen, itemType, loadMasterItems]);

  const handleAddItem = async () => {
    if (!itemId || itemQty < 1) return;
    setAddingItem(true);
    try {
      const result = await addBillingItem(id, itemType, itemId, itemQty, itemNotes || undefined);
      if (result.success) {
        setItemDialogOpen(false);
        setItemId("");
        setItemQty(1);
        setItemNotes("");
        await fetchBilling();
      }
    } finally {
      setAddingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeBillingItem(id, itemId);
    await fetchBilling();
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const result = await completeBilling(id);
      if (result.success) {
        await fetchBilling();
      }
    } finally {
      setCompleting(false);
    }
  };

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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Billing tidak ditemukan</p>
          <Link href="/billings" className={cn(buttonVariants({ variant: "link" }))}>
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const total = billing.billingItems.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/billings"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{billing.billingNumber}</h1>
            <p className="text-sm text-muted-foreground">Detail billing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={billing.status} />
          {billing.status === "OPEN" && (
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipe Item</Label>
                    <Select value={itemType} onValueChange={(v) => { setItemType(v); setItemId(""); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SERVICE">Layanan</SelectItem>
                        <SelectItem value="DRUG">Obat</SelectItem>
                        <SelectItem value="PRODUCT">Produk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Item</Label>
                    <Select value={itemId} onValueChange={setItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih item" />
                      </SelectTrigger>
                      <SelectContent>
                        {masterItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
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
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan (Opsional)</Label>
                    <Textarea
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder="Catatan untuk item ini"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddItem} disabled={addingItem || !itemId || itemQty < 1}>
                    {addingItem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tambah
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {billing.status === "OPEN" && billing.billingItems.length > 0 && (
            <Button onClick={handleComplete} disabled={completing}>
              {completing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Selesaikan
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                  <p className="text-sm font-medium">{formatDate(billing.billingStartDate)}</p>
                </div>
                {billing.billingEndDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                    <p className="text-sm font-medium">{formatDate(billing.billingEndDate)}</p>
                  </div>
                )}
              </div>
              {billing.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Catatan</p>
                  <p className="text-sm">{billing.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item Billing</CardTitle>
            </CardHeader>
            <CardContent>
              {billing.billingItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada item</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 text-sm font-medium text-muted-foreground">
                    <span>Item</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Harga</span>
                    <span className="text-right">Subtotal</span>
                    <span />
                  </div>
                  {billing.billingItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_80px_100px_100px_40px] items-center gap-2 border-t py-2 text-sm"
                    >
                      <span>
                        {item.service?.name || item.drug?.name || item.product?.name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({item.itemType === "SERVICE" ? "Layanan" : item.itemType === "DRUG" ? "Obat" : "Produk"})
                        </span>
                      </span>
                      <span className="text-right">{item.quantity}</span>
                      <span className="text-right">{formatCurrency(Number(item.unitPrice))}</span>
                      <span className="text-right font-medium">
                        {formatCurrency(Number(item.subtotal))}
                      </span>
                      {billing.status === "OPEN" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="border-t pt-2 text-sm font-bold">
                    <div className="flex justify-end">
                      Total: {formatCurrency(total)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/customers/${billing.customer.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {billing.customer.name}
              </Link>
              <p className="text-sm text-muted-foreground">{billing.customer.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hewan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{billing.pet.name}</p>
              <p className="text-sm text-muted-foreground">{billing.pet.species}</p>
            </CardContent>
          </Card>

          {billing.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/invoices/${billing.invoice.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {billing.invoice.invoiceNumber}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  Status: {billing.invoice.status}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
