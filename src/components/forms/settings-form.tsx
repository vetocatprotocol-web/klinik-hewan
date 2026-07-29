"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SettingsFormProps {
  activeTab: string;
  onSubmit: (data: any) => Promise<any>;
  initialData?: Record<string, any>;
}

export function SettingsForm({ activeTab, onSubmit, initialData = {} }: SettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  useEffect(() => { setFormData(initialData); }, [initialData, activeTab]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({ tab: activeTab, data: formData });
      toast({ title: "Pengaturan berhasil disimpan" });
    } catch {
      toast({ title: "Gagal menyimpan pengaturan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === "company") {
    return (
      <Card>
        <CardHeader><CardTitle>Informasi Klinik</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Nama Klinik</Label><Input value={formData.clinicName || ""} onChange={e => updateField("clinicName", e.target.value)} /></div>
            <div className="space-y-2"><Label>Telepon</Label><Input value={formData.phone || ""} onChange={e => updateField("phone", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Alamat</Label><Textarea value={formData.address || ""} onChange={e => updateField("address", e.target.value)} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email || ""} onChange={e => updateField("email", e.target.value)} /></div>
            <div className="space-y-2"><Label>Nomor NPWP</Label><Input value={formData.npwp || ""} onChange={e => updateField("npwp", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Jam Operasional</Label><Input value={formData.operatingHours || ""} onChange={e => updateField("operatingHours", e.target.value)} placeholder="Contoh: Senin-Sabtu 08:00-17:00" /></div>
          <div className="space-y-2"><Label>Catatan Footer Invoice</Label><Textarea value={formData.invoiceFooterNotes || ""} onChange={e => updateField("invoiceFooterNotes", e.target.value)} /></div>
          <div className="flex justify-end"><Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button></div>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === "tax") {
    return (
      <Card>
        <CardHeader><CardTitle>Pengaturan Pajak</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={formData.taxEnabled ?? true} onCheckedChange={(v) => updateField("taxEnabled", v)} />
            <Label>Aktifkan Pajak</Label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipe Pajak</Label>
              <Select value={formData.taxType || "PERCENTAGE"} onValueChange={(v) => updateField("taxType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                  <SelectItem value="FLAT">Flat (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nilai Pajak</Label>
              <Input type="number" step="0.1" value={formData.taxValue || 11} onChange={e => updateField("taxValue", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex justify-end"><Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button></div>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === "payment") {
    const methods = formData.methods || [{ name: "CASH", active: true, instructions: "" }];
    return (
      <Card>
        <CardHeader><CardTitle>Metode Pembayaran</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {methods.map((m: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Switch checked={m.active} onCheckedChange={(v) => { const updated = [...methods]; updated[i] = { ...m, active: v }; updateField("methods", updated); }} />
              <div className="flex-1"><p className="font-medium">{m.name}</p></div>
            </div>
          ))}
          <div className="flex justify-end"><Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button></div>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === "numbering") {
    const formats = formData.formats || [];
    return (
      <Card>
        <CardHeader><CardTitle>Format Numbering</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {formats.map((f: any, i: number) => (
            <div key={i} className="grid gap-3 md:grid-cols-2 items-end">
              <div className="space-y-1"><Label className="text-xs">{f.entity}</Label><Input value={f.prefix} onChange={e => { const updated = [...formats]; updated[i] = { ...f, prefix: e.target.value }; updateField("formats", updated); }} /></div>
            </div>
          ))}
          <div className="flex justify-end"><Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button></div>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === "fraud") {
    return (
      <Card>
        <CardHeader><CardTitle>Kebijakan Pencegahan Penipuan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Batas Diskon Otomatis (Rp)</Label><Input type="number" value={formData.discountLimit || 1000000} onChange={e => updateField("discountLimit", parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Batas Adjustment Stok</Label><Input type="number" value={formData.stockAdjustmentThreshold || 10} onChange={e => updateField("stockAdjustmentThreshold", parseInt(e.target.value) || 0)} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Batas PO (Rp)</Label><Input type="number" value={formData.poApprovalThreshold || 5000000} onChange={e => updateField("poApprovalThreshold", parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Toleransi Selisih Kas (Rp)</Label><Input type="number" value={formData.reconciliationTolerance || 50000} onChange={e => updateField("reconciliationTolerance", parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="flex justify-end"><Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button></div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
