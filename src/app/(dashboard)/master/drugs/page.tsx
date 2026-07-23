"use client";

import { useState, useEffect, useCallback } from "react";
import { getDrugs } from "@/server/queries";
import {
  createDrug,
  updateDrug,
  archiveDrug,
} from "@/server/actions/services";
import { formatCurrency } from "@/lib/utils";
import { DRUG_UNITS } from "@/lib/constants";
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

interface DrugRow {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  pricePerUnit: number;
  status: string;
}

export default function DrugsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DrugRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDrugs({ page, search });
      setData(result.data as unknown as DrugRow[]);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setUnit("");
    setPricePerUnit("");
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (drug: DrugRow) => {
    setEditingId(drug.id);
    setName(drug.name);
    setDescription(drug.description || "");
    setUnit(drug.unit);
    setPricePerUnit(String(drug.pricePerUnit));
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
      formData.set("unit", unit);
      formData.set("pricePerUnit", pricePerUnit);

      let result;
      if (editingId) {
        result = await updateDrug(editingId, null, formData);
      } else {
        result = await createDrug(null, formData);
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
    const result = await archiveDrug(archiveId);
    if (result.success) {
      setArchiveId(null);
      fetchData();
    }
  };

  const columns: ColumnDef<DrugRow>[] = [
    {
      id: "name",
      header: "Nama",
      accessorKey: "name",
    },
    {
      id: "unit",
      header: "Unit",
      renderCell: (row) => {
        const u = DRUG_UNITS.find((d) => d.value === row.unit);
        return u?.label || row.unit;
      },
    },
    {
      id: "pricePerUnit",
      header: "Harga/Unit",
      renderCell: (row) => formatCurrency(row.pricePerUnit),
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
          <h1 className="text-2xl font-bold">Obat</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data obat klinik
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Obat
        </Button>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nama obat..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada obat"
        emptyDescription="Tambahkan obat baru untuk memulai"
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
              {editingId ? "Ubah Obat" : "Tambah Obat"}
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
              <Label>Unit *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit" />
                </SelectTrigger>
                <SelectContent>
                  {DRUG_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Harga per Unit *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
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
            <DialogTitle>Arsipkan Obat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin mengarsipkan obat ini? Obat yang diarsipkan
            tidak akan muncul di pilihan.
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
