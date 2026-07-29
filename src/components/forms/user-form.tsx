"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { userSchema } from "@/lib/validators";
import { ROLES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: { id?: string; name?: string; email?: string; phone?: string; roleId?: string; };
  onSubmit: (data: UserFormData) => Promise<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles?: Array<{ id: string; name: string }>;
}

export function UserForm({ initialData, onSubmit, open, onOpenChange, roles = [] }: UserFormProps) {
  const isEdit = !!initialData?.id;
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    resolver: zodResolver(isEdit ? userSchema.omit({ password: true }) : userSchema),
    defaultValues: { name: initialData?.name || "", email: initialData?.email || "", phone: initialData?.phone || "", roleId: initialData?.roleId || "", password: "" },
  });

  useEffect(() => {
    if (open) reset({ name: initialData?.name || "", email: initialData?.email || "", phone: initialData?.phone || "", roleId: initialData?.roleId || "", password: "" });
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: UserFormData) => { await onSubmit(data); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Nama <span className="text-destructive">*</span></Label><Input id="name" {...register("name")} placeholder="Nama lengkap" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="email">Email <span className="text-destructive">*</span></Label><Input id="email" type="email" {...register("email")} placeholder="Email" />{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="phone">Telepon</Label><Input id="phone" {...register("phone")} placeholder="Nomor telepon" /></div>
          <div className="space-y-2">
            <Label>Role <span className="text-destructive">*</span></Label>
            <Select value={watch("roleId")} onValueChange={(v) => setValue("roleId", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
              <SelectContent>
                {roles.length > 0 ? roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>) : Object.values(ROLES).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.roleId && <p className="text-sm text-destructive">{errors.roleId.message}</p>}
          </div>
          {!isEdit && (
            <div className="space-y-2"><Label htmlFor="password">Password <span className="text-destructive">*</span></Label><Input id="password" type="password" {...register("password")} placeholder="Password (min 8 karakter)" />{errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}</div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
