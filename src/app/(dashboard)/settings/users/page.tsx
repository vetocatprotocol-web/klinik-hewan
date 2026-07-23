"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchUsers, fetchRoles } from "@/server/actions/queries";
import {
  createUser,
  updateUser,
  disableUser,
  enableUser,
  resetUserPassword,
} from "@/server/actions/users";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, ShieldOff, ShieldCheck, KeyRound } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: { id: string; name: string };
  status: string;
  lastLoginAt: string | null;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toggleId, setToggleId] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<"disable" | "enable">("disable");
  const [resetId, setResetId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResult, rolesResult] = await Promise.all([
        fetchUsers({ page, search, role: role || undefined }),
        fetchRoles(),
      ]);
      setData(usersResult.data as UserRow[]);
      setTotalPages(usersResult.totalPages);
      setRoles(rolesResult as Role[]);
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, role]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setRoleId("");
    setPassword("");
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || "");
    setRoleId(user.role.id);
    setPassword("");
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
      formData.set("email", email);
      formData.set("phone", phone);
      formData.set("roleId", roleId);
      if (!editingId && password) {
        formData.set("password", password);
      }

      let result;
      if (editingId) {
        result = await updateUser(editingId, null, formData);
      } else {
        result = await createUser(null, formData);
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

  const handleToggle = async () => {
    if (!toggleId) return;
    const result =
      toggleTarget === "disable"
        ? await disableUser(toggleId)
        : await enableUser(toggleId);
    if (result.success) {
      setToggleId(null);
      fetchData();
    }
  };

  const handleResetPassword = async () => {
    if (!resetId) return;
    const result = await resetUserPassword(resetId);
    if (result.success) {
      setTempPassword(result.data as string);
      setResetId(null);
    }
  };

  const columns: ColumnDef<UserRow>[] = [
    {
      id: "name",
      header: "Nama",
      accessorKey: "name",
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
    },
    {
      id: "role",
      header: "Role",
      renderCell: (row) => row.role?.name || "-",
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "lastLoginAt",
      header: "Terakhir Login",
      renderCell: (row) =>
        row.lastLoginAt
          ? new Date(row.lastLoginAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
    },
    {
      id: "actions",
      header: "Aksi",
      className: "text-right",
      renderCell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Pencil className="mr-1 h-3 w-3" />
            Ubah
          </Button>
          {row.status === "ACTIVE" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setToggleId(row.id);
                setToggleTarget("disable");
              }}
            >
              <ShieldOff className="mr-1 h-3 w-3" />
              Nonaktif
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setToggleId(row.id);
                setToggleTarget("enable");
              }}
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              Aktifkan
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetId(row.id)}
          >
            <KeyRound className="mr-1 h-3 w-3" />
            Reset PW
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun pengguna klinik
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      <DataTableToolbar>
        <SearchInput
          placeholder="Cari nama atau email..."
          value={search}
          onChange={setSearch}
          className="w-full max-w-sm"
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle="Belum ada pengguna"
        emptyDescription="Tambahkan pengguna baru untuk memulai"
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
              {editingId ? "Ubah Pengguna" : "Tambah Pengguna"}
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingId}
                />
              </div>
            )}
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

      <ConfirmDialog
        open={!!toggleId}
        onOpenChange={() => setToggleId(null)}
        title={toggleTarget === "disable" ? "Nonaktifkan Pengguna" : "Aktifkan Pengguna"}
        description={
          toggleTarget === "disable"
            ? "Apakah Anda yakin ingin menonaktifkan pengguna ini? Pengguna tidak akan bisa login."
            : "Apakah Anda yakin ingin mengaktifkan pengguna ini?"
        }
        confirmText={toggleTarget === "disable" ? "Nonaktifkan" : "Aktifkan"}
        variant={toggleTarget === "disable" ? "destructive" : "default"}
        onConfirm={handleToggle}
      />

      <ConfirmDialog
        open={!!resetId}
        onOpenChange={() => setResetId(null)}
        title="Reset Password"
        description="Apakah Anda yakin ingin mereset password pengguna ini? Password baru akan ditampilkan."
        confirmText="Reset"
        onConfirm={handleResetPassword}
      />

      <Dialog open={!!tempPassword} onOpenChange={() => setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Password sementara untuk pengguna:
            </p>
            <div className="rounded-md bg-muted p-3 font-mono text-sm">
              {tempPassword}
            </div>
            <p className="text-xs text-muted-foreground">
              Berikan password ini kepada pengguna. Mereka diwajibkan mengganti
              password setelah login pertama.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
