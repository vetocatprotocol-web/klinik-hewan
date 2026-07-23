"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts, getProductCategories } from "@/server/queries";
import {
  createProduct,
  updateProduct,
  archiveProduct,
} from "@/server/actions/services";
import { formatCurrency } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Archive, AlertTriangle } from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  categoryId: string;
  category: { id: string; name: string };
  price: number;
  currentStock: number;
  reorderPoint: number;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [reorderPoint, setReorderPoint] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsResult, cats] = await Promise.all([
        getProducts({ page, search, categoryId: categoryId || undefined }),
        getProductCategories(),
      ]);
      setData(productsResult.data as unknown as ProductRow[]);
      setTotalPages(productsResult.totalPages);
      setCategories(cats as Category[]);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setProductCategoryId("");
    setPrice("");
    setBarcode("");
    setCurrentStock("0");
    setReorderPoint("10");
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (product: ProductRow) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription("");
    setProductCategoryId(product.categoryId);
    setPrice(String(product.price));
    setBarcode("");
    setCurrentStock(String(product.currentStock));
    setReorderPoint(String(product.reorderPoint));
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("description", description);
      formData.set("categoryId", productCategoryId);
      formData.set("price", price);
      formData.set("barcode", barcode);
      formData.set("currentStock", currentStock);
      formData.set("reorderPoint", reorderPoint);

      let result;
      if (editingId) {
        result = await updateProduct(editingId, null, formData);
      } else {
        result = await createProduct(null, formData);
      }

      if (result.success) {
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveId) return;
    const result = await archiveProduct(archiveId);
    if (result.success) {
      setArchiveId(null);
      fetchData();
    }
  };

  const columns: ColumnDef<ProductRow>[] = [
    {
      id: "name",
      header: "Nama",
      accessorKey: "name",
    },
    {
      id: "category",
      header: "Kategori",
      renderCell: (row) => row.category?.name || "-",
    },
    {
      id: "price",
      header: "Harga",
      renderCell: (row) => formatCurrency(row.price),
    },
    {
      id: "stock",
      header: "Stok",
      renderCell: (row) => (
        <span
          className={
            row.currentStock <= row.reorderPoint
              ? "font-medium text-red-600"
              : ""
          }
        >
          {row.currentStock}
          {row.currentStock <= row.reorderPoint && (
            <AlertTriangle className="ml-1 inline h-3 w-3 text-red-500" />
          )}
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
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "Aksi",
      className: "text-right",
      renderCell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(row)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Ubah
          </Button>
          {row.status !== "ARCHIVED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setArchiveId(row.id)}
            >
              <Archive className="mr-1 h-3 w-3" />
              Arsip
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data produk klinik
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nama produk..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada produk"
        emptyDescription="Tambahkan produk baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Ubah Produk" : "Tambah Produk"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select
                value={productCategoryId}
                onValueChange={setProductCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Harga *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stok Awal</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder">Reorder Point</Label>
                <Input
                  id="reorder"
                  type="number"
                  min="0"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Produk</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin mengarsipkan produk ini? Produk yang
            diarsipkan tidak akan muncul di POS.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleArchive}>
              Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
