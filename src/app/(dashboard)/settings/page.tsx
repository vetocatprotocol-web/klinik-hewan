"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchSettings } from "@/server/actions/queries";
import {
  updateCompanyInfo,
  updateTaxConfig,
  updatePaymentMethods,
} from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Save } from "lucide-react";

interface CompanyInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  invoiceFooter?: string;
  receiptFooter?: string;
}

interface TaxConfig {
  type?: string;
  value?: number;
  enabled?: boolean;
}

interface PaymentMethod {
  name: string;
  type: string;
  active: boolean;
}

interface SettingsData {
  company_info?: CompanyInfo;
  tax_config?: TaxConfig;
  payment_methods?: PaymentMethod[];
}

export default function SettingsPage() {
  const [, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [invoiceFooter, setInvoiceFooter] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");

  const [taxType, setTaxType] = useState("FLAT");
  const [taxValue, setTaxValue] = useState("0");
  const [taxEnabled, setTaxEnabled] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [, setNumberingFormat] = useState("");
  const [numberingPrefix, setNumberingPrefix] = useState("");
  const [numberingLength, setNumberingLength] = useState("5");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data as SettingsData);

      const ci = data.company_info as CompanyInfo | undefined;
      if (ci) {
        setCompanyName(ci.name || "");
        setCompanyAddress(ci.address || "");
        setCompanyPhone(ci.phone || "");
        setCompanyEmail(ci.email || "");
        setCompanyTaxId(ci.taxId || "");
        setInvoiceFooter(ci.invoiceFooter || "");
        setReceiptFooter(ci.receiptFooter || "");
      }

      const tc = data.tax_config as TaxConfig | undefined;
      if (tc) {
        setTaxType(tc.type || "FLAT");
        setTaxValue(String(tc.value || 0));
        setTaxEnabled(tc.enabled || false);
      }

      const pm = data.payment_methods as PaymentMethod[] | undefined;
      if (pm) {
        setPaymentMethods(pm);
      } else {
        setPaymentMethods([
          { name: "Tunai", type: "CASH", active: true },
          { name: "Transfer Bank", type: "BANK_TRANSFER", active: true },
          { name: "Kartu", type: "CARD", active: false },
          { name: "e-Wallet", type: "EWALLET", active: false },
        ]);
      }

      const nf = data.numbering_config as any;
      if (nf) {
        setNumberingFormat(nf.format || "");
        setNumberingPrefix(nf.prefix || "");
        setNumberingLength(String(nf.length || 5));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveCompanyInfo = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("name", companyName);
      formData.set("address", companyAddress);
      formData.set("phone", companyPhone);
      formData.set("email", companyEmail);
      formData.set("taxId", companyTaxId);
      formData.set("invoiceFooter", invoiceFooter);
      formData.set("receiptFooter", receiptFooter);
      const result = await updateCompanyInfo(null, formData);
      if (result.success) {
        showMessage("success", "Informasi perusahaan berhasil disimpan");
        loadSettings();
      } else {
        showMessage("error", result.error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxConfig = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("type", taxType);
      formData.set("value", taxValue);
      formData.set("enabled", String(taxEnabled));
      const result = await updateTaxConfig(null, formData);
      if (result.success) {
        showMessage("success", "Konfigurasi pajak berhasil disimpan");
        loadSettings();
      } else {
        showMessage("error", result.error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentMethods = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("methods", JSON.stringify(paymentMethods));
      const result = await updatePaymentMethods(null, formData);
      if (result.success) {
        showMessage("success", "Metode pembayaran berhasil disimpan");
        loadSettings();
      } else {
        showMessage("error", result.error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (index: number) => {
    setPaymentMethods((prev) =>
      prev.map((m, i) => (i === index ? { ...m, active: !m.active } : m))
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi pengaturan klinik
        </p>
      </div>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Info Perusahaan</TabsTrigger>
          <TabsTrigger value="tax">Konfigurasi Pajak</TabsTrigger>
          <TabsTrigger value="payment">Metode Pembayaran</TabsTrigger>
          <TabsTrigger value="numbering">Format Nomor</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Perusahaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nama Klinik *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Alamat</Label>
                <Textarea
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telepon</Label>
                  <Input
                    id="companyPhone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyTaxId">NPWP / Tax ID</Label>
                <Input
                  id="companyTaxId"
                  value={companyTaxId}
                  onChange={(e) => setCompanyTaxId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceFooter">Footer Invoice</Label>
                <Textarea
                  id="invoiceFooter"
                  value={invoiceFooter}
                  onChange={(e) => setInvoiceFooter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Footer Struk</Label>
                <Textarea
                  id="receiptFooter"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCompanyInfo} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Konfigurasi Pajak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aktifkan Pajak</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan pengenaan pajak pada invoice
                  </p>
                </div>
                <Switch
                  checked={taxEnabled}
                  onCheckedChange={setTaxEnabled}
                />
              </div>
              {taxEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Tipe Pajak</Label>
                    <Select value={taxType} onValueChange={setTaxType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLAT">Flat (Rupiah)</SelectItem>
                        <SelectItem value="PERCENTAGE">Persen (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxValue">
                      Nilai {taxType === "PERCENTAGE" ? "(%)" : "(Rp)"}
                    </Label>
                    <Input
                      id="taxValue"
                      type="number"
                      min="0"
                      value={taxValue}
                      onChange={(e) => setTaxValue(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSaveTaxConfig} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Aktifkan atau nonaktifkan metode pembayaran yang tersedia.
              </p>
              <div className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <div
                    key={method.type}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.type}
                      </p>
                    </div>
                    <Switch
                      checked={method.active}
                      onCheckedChange={() => togglePaymentMethod(index)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSavePaymentMethods} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbering">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Format Nomor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Konfigurasi format penomoran otomatis untuk invoice, kunjungan, dan pembayaran.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numberingPrefix">Prefix</Label>
                  <Input
                    id="numberingPrefix"
                    value={numberingPrefix}
                    onChange={(e) => setNumberingPrefix(e.target.value)}
                    placeholder="INV, VIS, PAY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberingLength">Panjang Nomor</Label>
                  <Input
                    id="numberingLength"
                    type="number"
                    min="4"
                    max="10"
                    value={numberingLength}
                    onChange={(e) => setNumberingLength(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
