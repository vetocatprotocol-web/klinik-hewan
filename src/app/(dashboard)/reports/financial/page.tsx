"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getRevenueReport,
  getPaymentReport,
  getReceivablesAgingReport,
  getCollectionRateReport,
} from "@/server/actions/reports";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";

interface RevenueData {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalPayments: number;
  byMethod: Record<string, number>;
  payments: any[];
}

interface PaymentData {
  unpaidInvoices: any[];
  totalUnpaid: number;
  totalPaid: number;
  byMethod: Record<string, number>;
}

interface AgingBucket {
  count: number;
  total: number;
  invoices: any[];
}

interface ReceivablesAgingData {
  buckets: {
    "0-30": AgingBucket;
    "31-60": AgingBucket;
    "61-90": AgingBucket;
    ">90": AgingBucket;
  };
  totalUnpaid: number;
  totalOutstanding: number;
}

interface CollectionRateData {
  dateFrom: string | null;
  dateTo: string | null;
  totalInvoices: number;
  paidCount: number;
  unpaidCount: number;
  collectionRate: number;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  collectionRateByAmount: number;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  CARD: "Kartu",
  EWALLET: "e-Wallet",
  OTHER: "Lainnya",
};

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState("daily");
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [agingData, setAgingData] = useState<ReceivablesAgingData | null>(null);
  const [collectionData, setCollectionData] = useState<CollectionRateData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRevenueReport(dateFrom, dateTo);
      setRevenueData(result as RevenueData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaymentReport();
      setPaymentData(result as PaymentData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAging = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReceivablesAgingReport();
      setAgingData(result as ReceivablesAgingData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCollectionRate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCollectionRateReport(dateFrom, dateTo);
      setCollectionData(result as CollectionRateData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === "daily" || activeTab === "revenue") {
      fetchRevenue();
    } else if (activeTab === "receivables") {
      fetchPayments();
    } else if (activeTab === "aging") {
      fetchAging();
    } else if (activeTab === "collection") {
      fetchCollectionRate();
    }
  }, [activeTab, fetchRevenue, fetchPayments, fetchAging, fetchCollectionRate]);

  const receivableColumns: ColumnDef<any>[] = [
    {
      id: "invoiceNumber",
      header: "Nomor Invoice",
      renderCell: (row) => (
        <span className="font-medium">{row.invoiceNumber}</span>
      ),
    },
    {
      id: "customer",
      header: "Pelanggan",
      renderCell: (row) => row.customer?.name || "-",
    },
    {
      id: "total",
      header: "Total",
      renderCell: (row) => formatCurrency(Number(row.total)),
    },
    {
      id: "paidAmount",
      header: "Dibayar",
      renderCell: (row) => formatCurrency(Number(row.paidAmount || 0)),
    },
    {
      id: "remaining",
      header: "Sisa",
      renderCell: (row) =>
        formatCurrency(Number(row.total) - Number(row.paidAmount || 0)),
    },
    {
      id: "invoiceDate",
      header: "Tanggal",
      renderCell: (row) => formatDate(row.invoiceDate),
    },
  ];

  const agingBucketLabels: { key: keyof ReceivablesAgingData["buckets"]; label: string }[] = [
    { key: "0-30", label: "0-30 hari" },
    { key: "31-60", label: "31-60 hari" },
    { key: "61-90", label: "61-90 hari" },
    { key: ">90", label: ">90 hari" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <p className="text-sm text-muted-foreground">
          Analisis keuangan dan pendapatan klinik
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
          <TabsTrigger value="receivables">Piutang</TabsTrigger>
          <TabsTrigger value="aging">Penuaan Piutang</TabsTrigger>
          <TabsTrigger value="collection">Tingkat Pengumpulan</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
            />
            <Button onClick={fetchRevenue} variant="outline">
              Muat Ulang
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Pendapatan</p>
              <p className="text-2xl font-bold">
                {formatCurrency(revenueData?.totalRevenue || 0)}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold">
                {revenueData?.totalPayments || 0}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Rata-rata/Transaksi</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  revenueData && revenueData.totalPayments > 0
                    ? revenueData.totalRevenue / revenueData.totalPayments
                    : 0
                )}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Rincian Harian</h3>
            <DataTable
              columns={[
                {
                  id: "date",
                  header: "Tanggal",
                  renderCell: (_row: any, index: number) => {
                    const date = new Date(dateFrom);
                    date.setDate(date.getDate() + index);
                    return formatDate(date);
                  },
                },
                {
                  id: "revenue",
                  header: "Pendapatan",
                  renderCell: () => "-",
                },
              ]}
              data={[]}
              loading={loading}
              emptyTitle="Belum ada data"
              emptyDescription="Pilih rentang tanggal untuk melihat laporan"
            />
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
            />
            <Button onClick={fetchRevenue} variant="outline">
              Muat Ulang
            </Button>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Pendapatan per Metode Pembayaran</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : revenueData?.byMethod ? (
              <div className="space-y-3">
                {Object.entries(revenueData.byMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm">{METHOD_LABELS[method] || method}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">
                    {formatCurrency(revenueData.totalRevenue)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada data</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Detail Transaksi</h3>
            <DataTable
              columns={[
                {
                  id: "date",
                  header: "Tanggal",
                  renderCell: (row: any) => formatDate(row.createdAt),
                },
                {
                  id: "method",
                  header: "Metode",
                  renderCell: (row: any) =>
                    METHOD_LABELS[row.paymentMethod] || row.paymentMethod,
                },
                {
                  id: "amount",
                  header: "Jumlah",
                  renderCell: (row: any) => formatCurrency(Number(row.amount)),
                },
              ]}
              data={revenueData?.payments || []}
              loading={loading}
              emptyTitle="Belum ada transaksi"
              emptyDescription="Transaksi akan muncul di sini"
            />
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Piutang</p>
              <p className="text-2xl font-bold text-red-600">
                {paymentData?.totalUnpaid || 0} invoice
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Lunas</p>
              <p className="text-2xl font-bold text-green-600">
                {paymentData?.totalPaid || 0} invoice
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Tingkat Pengumpulan</p>
              <p className="text-2xl font-bold">
                {paymentData && paymentData.totalPaid + paymentData.totalUnpaid > 0
                  ? Math.round(
                      (paymentData.totalPaid /
                        (paymentData.totalPaid + paymentData.totalUnpaid)) *
                        100
                    )
                  : 0}
                %
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Piutang per Metode Pembayaran</h3>
            {paymentData?.byMethod ? (
              <div className="space-y-3">
                {Object.entries(paymentData.byMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm">{METHOD_LABELS[method] || method}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada data</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Daftar Invoice Belum Dibayar</h3>
            <DataTable
              columns={receivableColumns}
              data={paymentData?.unpaidInvoices || []}
              loading={loading}
              emptyTitle="Tidak ada piutang"
              emptyDescription="Semua invoice telah lunas"
            />
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Invoice Belum Dibayar</p>
              <p className="text-2xl font-bold text-red-600">
                {agingData?.totalUnpaid || 0}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Sisa Piutang</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(agingData?.totalOutstanding || 0)}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Penuaan Piutang Berdasarkan Umur</h3>
            <DataTable
              columns={[
                {
                  id: "bucket",
                  header: "Umur Piutang",
                  renderCell: (row: any) => (
                    <span className="font-medium">{row.label}</span>
                  ),
                },
                {
                  id: "count",
                  header: "Jumlah Invoice",
                  renderCell: (row: any) => row.count,
                },
                {
                  id: "total",
                  header: "Total Nilai",
                  renderCell: (row: any) => formatCurrency(row.total),
                },
              ]}
              data={agingBucketLabels.map((b) => ({
                label: b.label,
                count: agingData?.buckets[b.key]?.count || 0,
                total: agingData?.buckets[b.key]?.total || 0,
              }))}
              loading={loading}
              emptyTitle="Belum ada data"
              emptyDescription="Data penuaan piutang akan muncul di sini"
            />
          </Card>

          {agingData && agingData.totalUnpaid > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Rincian Piutang per Umur</h3>
              {agingBucketLabels.map((b) => {
                const bucket = agingData.buckets[b.key];
                if (!bucket || bucket.count === 0) return null;
                return (
                  <div key={b.key} className="mb-4 last:mb-0">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{b.label}</p>
                    <div className="space-y-2">
                      {bucket.invoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{inv.invoiceNumber}</span>
                            <span className="text-muted-foreground ml-2">
                              {inv.customer?.name || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">{inv.daysOverdue} hari</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(inv.outstanding)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
            />
            <Button onClick={fetchCollectionRate} variant="outline">
              Muat Ulang
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Invoice</p>
              <p className="text-2xl font-bold">
                {collectionData?.totalInvoices || 0}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Invoice Lunas</p>
              <p className="text-2xl font-bold text-green-600">
                {collectionData?.paidCount || 0}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Invoice Belum Lunas</p>
              <p className="text-2xl font-bold text-red-600">
                {collectionData?.unpaidCount || 0}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Tingkat Pengumpulan (per Invoice)</p>
              <p className="text-3xl font-bold">
                {collectionData?.collectionRate != null
                  ? collectionData.collectionRate.toFixed(1)
                  : "0"}
                %
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Tingkat Pengumpulan (per Nilai)</p>
              <p className="text-3xl font-bold">
                {collectionData?.collectionRateByAmount != null
                  ? collectionData.collectionRateByAmount.toFixed(1)
                  : "0"}
                %
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Rincian Pengumpulan</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Nilai Invoice</span>
                <span className="font-medium">
                  {formatCurrency(collectionData?.totalInvoiceAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Nilai Terkumpul</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(collectionData?.totalPaidAmount || 0)}
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Sisa Belum Terkumpul</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(
                    (collectionData?.totalInvoiceAmount || 0) -
                      (collectionData?.totalPaidAmount || 0)
                  )}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
