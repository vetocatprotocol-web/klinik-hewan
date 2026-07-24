"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchInvoices, fetchProducts, fetchPosOrders } from "@/server/actions/queries";
import { fetchVisits } from "@/server/actions/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Download,
  CalendarCheck,
  CircleDollarSign,
  Package,
  Users,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VisitRow {
  id: string;
  visitNumber: string;
  visitDate: string;
  status: string;
  diagnosis: string;
  customer: { id: string; name: string };
  pet: { id: string; name: string };
  visitItems: { id: string; subtotal: number; service?: { name: string } }[];
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  paidAmount: number;
  status: string;
  customer: { id: string; name: string };
  payments: { paymentMethod: string; amount: number }[];
  invoiceItems: { itemName: string; subtotal: number }[];
}

interface ProductRow {
  id: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  price: number;
  status: string;
  category?: { name: string };
}

function escapeCsvField(field: string | number): string {
  const str = String(field);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportCsv(headers: string[], rows: (string | number)[][], filename: string) {
  const csv = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((r) => r.map(escapeCsvField).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("daily");
  const [loading, setLoading] = useState(false);

  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dailyVisits, setDailyVisits] = useState<VisitRow[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [dailyTopServices, setDailyTopServices] = useState<{ name: string; visitCount: number }[]>([]);

  const [revenueDateFrom, setRevenueDateFrom] = useState("");
  const [revenueDateTo, setRevenueDateTo] = useState("");
  const [revenueByMethod, setRevenueByMethod] = useState<{ method: string; total: number }[]>([]);
  const [revenueByService, setRevenueByService] = useState<{ name: string; total: number }[]>([]);

  const [inventoryProducts, setInventoryProducts] = useState<ProductRow[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductRow[]>([]);

  const [customerStats, setCustomerStats] = useState<
    { name: string; visitCount: number; totalSpend: number; lastVisit: string }[]
  >([]);

  const [paymentInvoices, setPaymentInvoices] = useState<InvoiceRow[]>([]);
  const [paymentByMethod, setPaymentByMethod] = useState<{ method: string; total: number }[]>([]);

  const fetchDailyReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchVisits({ dateFrom: dailyDate, dateTo: dailyDate });
      const visits = result.data as unknown as VisitRow[];
      setDailyVisits(visits);

      const totalRevenue = visits.reduce(
        (sum, v) => sum + v.visitItems.reduce((s, i) => s + Number(i.subtotal), 0),
        0
      );
      setDailyRevenue(totalRevenue);

      const serviceCount: Record<string, number> = {};
      visits.forEach((v) => {
        v.visitItems.forEach((item) => {
          if (item.service) {
            serviceCount[item.service.name] = (serviceCount[item.service.name] || 0) + 1;
          }
        });
      });
      const topServices = Object.entries(serviceCount)
        .map(([name, visitCount]) => ({ name, visitCount }))
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 5);
      setDailyTopServices(topServices);
    } finally {
      setLoading(false);
    }
  }, [dailyDate]);

  const fetchRevenueReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchInvoices({
        dateFrom: revenueDateFrom || undefined,
        dateTo: revenueDateTo || undefined,
      });
      const invoices = result.data as unknown as InvoiceRow[];

      const byMethod: Record<string, number> = {};
      invoices.forEach((inv) => {
        inv.payments.forEach((p) => {
          byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + Number(p.amount);
        });
      });
      setRevenueByMethod(
        Object.entries(byMethod)
          .map(([method, total]) => ({ method, total }))
          .sort((a, b) => b.total - a.total)
      );

      const byService: Record<string, number> = {};
      invoices.forEach((inv) => {
        inv.invoiceItems.forEach((item) => {
          byService[item.itemName] = (byService[item.itemName] || 0) + Number(item.subtotal);
        });
      });
      setRevenueByService(
        Object.entries(byService)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)
      );
    } finally {
      setLoading(false);
    }
  }, [revenueDateFrom, revenueDateTo]);

  const fetchInventoryReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProducts({ page: 1 });
      const products = result.data as unknown as ProductRow[];
      setInventoryProducts(products);
      setLowStockProducts(products.filter((p) => p.currentStock <= p.reorderPoint));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomerReport = useCallback(async () => {
    setLoading(true);
    try {
      const [visitResult, invoiceResult] = await Promise.all([
        fetchVisits({ page: 1 }),
        fetchInvoices({}),
      ]);
      const visits = visitResult.data as unknown as VisitRow[];
      const invoices = invoiceResult.data as unknown as InvoiceRow[];

      const customerData: Record<string, { name: string; visitCount: number; totalSpend: number; lastVisit: string }> = {};
      
      visits.forEach((v) => {
        const id = v.customer.id;
        if (!customerData[id]) {
          customerData[id] = { name: v.customer.name, visitCount: 0, totalSpend: 0, lastVisit: "" };
        }
        customerData[id].visitCount++;
        const visitDate = v.visitDate;
        if (!customerData[id].lastVisit || visitDate > customerData[id].lastVisit) {
          customerData[id].lastVisit = visitDate;
        }
      });

      invoices.forEach((inv) => {
        const id = inv.customer.id;
        if (!customerData[id]) {
          customerData[id] = { name: inv.customer.name, visitCount: 0, totalSpend: 0, lastVisit: "" };
        }
        if (inv.status === "PAID") {
          customerData[id].totalSpend += Number(inv.total);
        }
      });

      const stats = Object.values(customerData)
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 10);
      setCustomerStats(stats);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaymentReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchInvoices({ status: "UNPAID" });
      setPaymentInvoices(result.data as unknown as InvoiceRow[]);

      const paidResult = await fetchInvoices({ status: "PAID" });
      const paidInvoices = paidResult.data as unknown as InvoiceRow[];
      const byMethod: Record<string, number> = {};
      paidInvoices.forEach((inv) => {
        inv.payments.forEach((p) => {
          byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + Number(p.amount);
        });
      });
      setPaymentByMethod(
        Object.entries(byMethod)
          .map(([method, total]) => ({ method, total }))
          .sort((a, b) => b.total - a.total)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "daily") fetchDailyReport();
    else if (activeTab === "revenue") fetchRevenueReport();
    else if (activeTab === "inventory") fetchInventoryReport();
    else if (activeTab === "customers") fetchCustomerReport();
    else if (activeTab === "payments") fetchPaymentReport();
  }, [activeTab, fetchDailyReport, fetchRevenueReport, fetchInventoryReport, fetchCustomerReport, fetchPaymentReport]);

  const exportDailyCsv = () => {
    const headers = ["No. Kunjungan", "Tanggal", "Pelanggan", "Hewan", "Diagnosis", "Total"];
    const rows = dailyVisits.map((v) => [
      v.visitNumber,
      formatDate(v.visitDate),
      v.customer.name,
      v.pet.name,
      v.diagnosis,
      v.visitItems.reduce((s, i) => s + Number(i.subtotal), 0),
    ]);
    exportCsv(headers, rows, `laporan-harian-${dailyDate}.csv`);
  };

  const exportRevenueCsv = () => {
    const headers = ["Metode", "Total Pendapatan"];
    const rows = revenueByMethod.map((r) => [r.method, r.total]);
    if (revenueByService.length > 0) {
      rows.push(["", ""]);
      rows.push(["--- Per Layanan/Produk ---", ""]);
      revenueByService.forEach((r) => rows.push([r.name, String(r.total)]));
    }
    exportCsv(headers, rows, `laporan-pendapatan.csv`);
  };

  const exportInventoryCsv = () => {
    const headers = ["Nama", "Kategori", "Stok", "Reorder Point", "Harga", "Status"];
    const rows = inventoryProducts.map((p) => [
      p.name,
      p.category?.name || "-",
      p.currentStock,
      p.reorderPoint,
      p.price,
      p.currentStock <= p.reorderPoint ? "MENIPIS" : "OK",
    ]);
    exportCsv(headers, rows, `laporan-inventaris.csv`);
  };

  const exportCustomersCsv = () => {
    const headers = ["Nama Pelanggan", "Jumlah Kunjungan", "Total Belanja", "Kunjungan Terakhir"];
    const rows = customerStats.map((c) => [c.name, String(c.visitCount), String(c.totalSpend), c.lastVisit ? formatDate(c.lastVisit) : "-"]);
    exportCsv(headers, rows, `laporan-pelanggan.csv`);
  };

  const exportPaymentsCsv = () => {
    const headers = ["No. Invoice", "Pelanggan", "Total", "Status"];
    const rows = paymentInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.customer.name,
      inv.total,
      inv.status,
    ]);
    exportCsv(headers, rows, `laporan-pembayaran.csv`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Lihat dan ekspor laporan klinik
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
          <TabsTrigger value="inventory">Inventaris</TabsTrigger>
          <TabsTrigger value="customers">Pelanggan</TabsTrigger>
          <TabsTrigger value="payments">Pembayaran</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Laporan Harian</CardTitle>
              <Button variant="outline" size="sm" onClick={exportDailyCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                  />
                </div>
                <Button onClick={fetchDailyReport} disabled={loading}>
                  {loading ? "Memuat..." : "Muat"}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Kunjungan</p>
                      <p className="text-2xl font-bold">{dailyVisits.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pendapatan</p>
                      <p className="text-2xl font-bold">{formatCurrency(dailyRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pelanggan Unik</p>
                      <p className="text-2xl font-bold">
                        {new Set(dailyVisits.map((v) => v.customer.id)).size}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {dailyTopServices.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">Layanan Teratas</h3>
                  <div className="space-y-2">
                    {dailyTopServices.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        <span className="text-sm">{s.name}</span>
                        <span className="text-sm font-medium">{s.visitCount}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Laporan Pendapatan</CardTitle>
              <Button variant="outline" size="sm" onClick={exportRevenueCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label>Dari Tanggal</Label>
                  <Input
                    type="date"
                    value={revenueDateFrom}
                    onChange={(e) => setRevenueDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={revenueDateTo}
                    onChange={(e) => setRevenueDateTo(e.target.value)}
                  />
                </div>
                <Button onClick={fetchRevenueReport} disabled={loading}>
                  {loading ? "Memuat..." : "Muat"}
                </Button>
              </div>
              {revenueByMethod.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">Pendapatan per Metode</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByMethod}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="method" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Pendapatan"]} />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {revenueByMethod.map((r) => (
                      <div
                        key={r.method}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{r.method}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(r.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {revenueByService.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">Pendapatan per Layanan/Produk</h3>
                  <div className="space-y-2">
                    {revenueByService.map((r) => (
                      <div
                        key={r.name}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <span className="text-sm">{r.name}</span>
                        <span className="font-medium">{formatCurrency(r.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Laporan Inventaris</CardTitle>
              <Button variant="outline" size="sm" onClick={exportInventoryCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockProducts.length > 0 && (
                <div className="rounded-md bg-yellow-50 p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {lowStockProducts.length} produk stok menipis
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {inventoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category?.name || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          product.currentStock <= product.reorderPoint
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        Stok: {product.currentStock}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reorder: {product.reorderPoint}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Laporan Pelanggan</CardTitle>
              <Button variant="outline" size="sm" onClick={exportCustomersCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customerStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada data pelanggan.
                  </p>
                ) : (
                  customerStats.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {i + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium">{c.name}</span>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{c.visitCount} kunjungan</span>
                            {c.totalSpend > 0 && <span>Total belanja: {formatCurrency(c.totalSpend)}</span>}
                            {c.lastVisit && <span>Kunjungan terakhir: {formatDate(c.lastVisit)}</span>}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={c.visitCount > 5 ? "ACTIVE" : "INACTIVE"} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Laporan Pembayaran</CardTitle>
              <Button variant="outline" size="sm" onClick={exportPaymentsCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-medium">Invoice Belum Dibayar</h3>
                {paymentInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Semua invoice sudah dibayar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {paymentInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {inv.customer.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(Number(inv.total))}
                          </p>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {paymentByMethod.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">Pembayaran per Metode</h3>
                  <div className="space-y-2">
                    {paymentByMethod.map((r) => (
                      <div
                        key={r.method}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <span className="text-sm">{r.method}</span>
                        <span className="font-medium">
                          {formatCurrency(r.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
