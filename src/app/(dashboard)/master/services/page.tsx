"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchServices } from "@/server/actions/queries";
import {
  createService,
  updateService,
  archiveService,
} from "@/server/actions/services";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/constants";
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
import { Plus, Pencil, Archive } from "lucide-react";

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  status: string;
  _count?: { billingItems: number };
}

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ServiceRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchServices({
        page,
        search,
        category: category || undefined,
      });
      setData(result.data as unknown as ServiceRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setServiceCategory("");
    setPrice("");
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (service: ServiceRow) => {
    setEditingId(service.id);
    setName(service.name);
    setDescription(service.description || "");
    setServiceCategory(service.category);
    setPrice(String(service.price));
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
      formData.set("category", serviceCategory);
      formData.set("price", price);

      let result;
      if (editingId) {
        result = await updateService(editingId, null, formData);
      } else {
        result = await createService(null, formData);
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
    const result = await archiveService(archiveId);
    if (result.success) {
      setArchiveId(null);
      fetchData();
    }
  };

  const columns: ColumnDef<ServiceRow>[] = [
    {
      id: "name",
      header: "Nama",
      accessorKey: "name",
    },
    {
      id: "category",
      header: "Kategori",
      renderCell: (row) => {
        const cat = SERVICE_CATEGORIES.find((c) => c.value === row.category);
        return cat?.label || row.category;
      },
    },
    {
      id: "price",
      header: "Harga",
      renderCell: (row) => formatCurrency(row.price),
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "usageCount",
      header: "Penggunaan",
      renderCell: (row) => (
        <span className="text-muted-foreground">
          {row._count?.billingItems || 0}x
        </span>
      ),
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
          <h1 className="text-2xl font-bold">Layanan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola layanan klinik
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Layanan
        </Button>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nama layanan..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada layanan"
        emptyDescription="Tambahkan layanan baru untuk memulai"
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Ubah Layanan" : "Tambah Layanan"}
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
              <Select value={serviceCategory} onValueChange={setServiceCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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
            <DialogTitle>Arsipkan Layanan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin mengarsipkan layanan ini? Layanan yang
            diarsipkan tidak akan muncul di pilihan.
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
