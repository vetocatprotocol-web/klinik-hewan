"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts } from "@/server/queries";
import { adjustStock } from "@/server/actions/stock";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
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
import {
  AlertTriangle,
  Package,
  Minus,
  Plus,
} from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  category: { id: string; name: string };
  currentStock: number;
  reorderPoint: number;
  status: string;
}

const STOCK_REASONS = [
  { value: "PURCHASE", label: "Pembelian" },
  { value: "RETURN", label: "Retur" },
  { value: "DAMAGED", label: "Rusak" },
  { value: "EXPIRED", label: "Kadaluarsa" },
  { value: "CORRECTION", label: "Koreksi Stok" },
  { value: "POS_SOLD", label: "Terjual via POS" },
  { value: "OTHER", label: "Lainnya" },
];

export default function StockPage() {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProducts({
        page,
        search,
        status: "ACTIVE",
      });
      let products = result.data as ProductRow[];
      if (lowStockOnly) {
        products = products.filter((p) => p.currentStock <= p.reorderPoint);
      }
      setData(products);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, lowStockOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, lowStockOnly]);

  const openAdjust = (product: ProductRow) => {
    setSelectedProduct(product);
    setQuantity("1");
    setDirection("add");
    setReason("");
    setNotes("");
    setError(null);
    setAdjustDialogOpen(true);
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    setError(null);

    try {
      const qty = parseInt(quantity) || 0;
      const adjustedQty = direction === "add" ? qty : -qty;

      const formData = new FormData();
      formData.set("productId", selectedProduct.id);
      formData.set("quantity", String(adjustedQty));
      formData.set("reason", reason);
      formData.set("notes", notes);

      const result = await adjustStock(null, formData);
      if (result.success) {
        setAdjustDialogOpen(false);
        fetchData();
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockCount = data.filter(
    (p) => p.currentStock <= p.reorderPoint
  ).length;

  const columns: ColumnDef<ProductRow>[] = [
    {
      id: "name",
      header: "Produk",
      accessorKey: "name",
    },
    {
      id: "category",
      header: "Kategori",
      renderCell: (row) => row.category?.name || "-",
    },
    {
      id: "currentStock",
      header: "Stok Saat Ini",
      renderCell: (row) => (
        <span
          className={
            row.currentStock <= row.reorderPoint
              ? "font-bold text-red-600"
              : "font-medium"
          }
        >
          {row.currentStock}
        </span>
      ),
    },
    {
      id: "reorderPoint",
      header: "Reorder Point",
      renderCell: (row) => row.reorderPoint,
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => {
        const isLow = row.currentStock <= row.reorderPoint;
        return isLow ? (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-200"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Stok Rendah
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Normal
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      className: "text-right",
      renderCell: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openAdjust(row)}
          >
            <Package className="mr-1 h-3 w-3" />
            Sesuaikan
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok</h1>
          <p className="text-sm text-muted-foreground">
            Kelola stok produk
          </p>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {lowStockCount} produk memiliki stok di bawah reorder point
          </span>
        </div>
      )}

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nama produk..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setLowStockOnly(!lowStockOnly)}
        >
          <AlertTriangle className="mr-1 h-3 w-3" />
          Stok Rendah
        </Button>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada produk"
        emptyDescription="Produk akan muncul di sini"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleAdjust} className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stok saat ini: {selectedProduct.currentStock}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Arah</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={direction === "add" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirection("add")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Tambah
                  </Button>
                  <Button
                    type="button"
                    variant={direction === "subtract" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirection("subtract")}
                  >
                    <Minus className="mr-1 h-3 w-3" />
                    Kurangi
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {direction === "add" ? "Menambah" : "Mengurangi"}{" "}
                  {quantity} unit. Stok baru:{" "}
                  {direction === "add"
                    ? selectedProduct.currentStock + (parseInt(quantity) || 0)
                    : selectedProduct.currentStock - (parseInt(quantity) || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Alasan *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan opsional..."
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submitting || !reason}>
                  {submitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
