"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getDailyReport,
  getInventoryReport,
  getVisitStatisticsReport,
  getHotelOccupancyReport,
  getDiagnosisBreakdownReport,
} from "@/server/actions/reports";
import { listSuppliers, getSupplierPerformance } from "@/server/actions/suppliers";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";

interface DailyReportData {
  date: string;
  totalVisits: number;
  totalRevenue: number;
  totalPayments: number;
  visits: any[];
  lowStockProducts: any[];
}

interface InventoryData {
  products: any[];
  lowStock: any[];
  outOfStock: any[];
  totalProducts: number;
}

interface VisitStatsData {
  totalVisits: number;
  byDoctor: { doctorId: string; name: string; count: number }[];
  byServiceCategory: { category: string; count: number }[];
  bySpecies: { species: string; count: number }[];
}

interface SupplierPerformanceData {
  supplier: { id: string; name: string };
  totalPOCount: number;
  totalSpend: number;
  onTimeDeliveryRate: number;
  statusBreakdown: {
    pending: number;
    partialReceived: number;
    received: number;
    cancelled: number;
  };
}

interface HotelOccupancyData {
  dateFrom: string | null;
  dateTo: string | null;
  totalRooms: number;
  occupancyRate: number;
  totalCapacity: number;
  totalOccupancy: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  avgLengthOfStay: number;
}

interface DiagnosisBreakdownData {
  dateFrom: string | null;
  dateTo: string | null;
  totalVisits: number;
  diagnoses: { diagnosis: string; count: number }[];
}

export default function OperationalReportsPage() {
  const [activeTab, setActiveTab] = useState("visits");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dailyData, setDailyData] = useState<DailyReportData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [visitStats, setVisitStats] = useState<VisitStatsData | null>(null);
  const [supplierData, setSupplierData] = useState<SupplierPerformanceData[]>([]);
  const [hotelData, setHotelData] = useState<HotelOccupancyData | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDailyReport(reportDate);
      setDailyData(result as DailyReportData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [reportDate]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInventoryReport();
      setInventoryData(result as InventoryData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVisitStats = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVisitStatisticsReport(dateFrom || undefined, dateTo || undefined);
      setVisitStats(result as VisitStatsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSuppliers({ page: 1, status: "ACTIVE" });
      const suppliers = result.data || [];
      const performances = await Promise.all(
        suppliers.map(async (s: any) => {
          const perf = await getSupplierPerformance(s.id);
          return perf.success ? perf.data : null;
        })
      );
      setSupplierData(performances.filter(Boolean) as SupplierPerformanceData[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHotelOccupancy = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getHotelOccupancyReport(dateFrom || undefined, dateTo || undefined);
      setHotelData(result as HotelOccupancyData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchDiagnosis = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDiagnosisBreakdownReport(dateFrom || undefined, dateTo || undefined);
      setDiagnosisData(result as DiagnosisBreakdownData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === "visits") {
      fetchDaily();
      fetchVisitStats();
    } else if (activeTab === "inventory") {
      fetchInventory();
    } else if (activeTab === "suppliers") {
      fetchSuppliers();
    } else if (activeTab === "hotel") {
      fetchHotelOccupancy();
    } else if (activeTab === "diagnosis") {
      fetchDiagnosis();
    }
  }, [activeTab, fetchDaily, fetchVisitStats, fetchInventory, fetchSuppliers, fetchHotelOccupancy, fetchDiagnosis]);

  const visitColumns: ColumnDef<any>[] = [
    {
      id: "visitNumber",
      header: "Nomor",
      renderCell: (row) => (
        <span className="font-medium">{row.visitNumber}</span>
      ),
    },
    {
      id: "customer",
      header: "Pelanggan",
      renderCell: (row) => row.customer?.name || "-",
    },
    {
      id: "pet",
      header: "Hewan",
      renderCell: (row) => row.pet?.name || "-",
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => row.status,
    },
  ];

  const inventoryColumns: ColumnDef<any>[] = [
    {
      id: "name",
      header: "Nama Produk",
      renderCell: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      id: "category",
      header: "Kategori",
      renderCell: (row) => row.category?.name || "-",
    },
    {
      id: "stock",
      header: "Stok",
      renderCell: (row) => (
        <span
          className={
            row.currentStock === 0
              ? "text-red-600 font-medium"
              : row.currentStock < row.reorderPoint
              ? "text-yellow-600 font-medium"
              : ""
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
      id: "valuation",
      header: "Nilai",
      renderCell: (row) => formatCurrency(row.currentStock * Number(row.price || 0)),
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => row.status,
    },
  ];

  const supplierColumns: ColumnDef<SupplierPerformanceData>[] = [
    {
      id: "name",
      header: "Nama Supplier",
      renderCell: (row) => (
        <span className="font-medium">{row.supplier?.name || "-"}</span>
      ),
    },
    {
      id: "totalPOCount",
      header: "Total PO",
      renderCell: (row) => row.totalPOCount,
    },
    {
      id: "onTimeDeliveryRate",
      header: "On-Time Delivery",
      renderCell: (row) => (
        <span
          className={
            row.onTimeDeliveryRate >= 90
              ? "text-green-600 font-medium"
              : row.onTimeDeliveryRate >= 70
              ? "text-yellow-600 font-medium"
              : "text-red-600 font-medium"
          }
        >
          {row.onTimeDeliveryRate}%
        </span>
      ),
    },
    {
      id: "totalSpend",
      header: "Total Pengeluaran",
      renderCell: (row) => formatCurrency(row.totalSpend),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Laporan Operasional</h1>
        <p className="text-sm text-muted-foreground">
          Statistik dan analisis operasional klinik
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="visits">Kunjungan</TabsTrigger>
          <TabsTrigger value="inventory">Inventaris</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier</TabsTrigger>
          <TabsTrigger value="hotel">Okupansi Hotel</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosa</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Dari"
              className="w-[160px]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Sampai"
              className="w-[160px]"
            />
            <Button onClick={() => { fetchDaily(); fetchVisitStats(); }} variant="outline">
              Muat Ulang
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Kunjungan Hari Ini</p>
              <p className="text-2xl font-bold">{dailyData?.totalVisits || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Pendapatan Hari Ini</p>
              <p className="text-2xl font-bold">
                {formatCurrency(dailyData?.totalRevenue || 0)}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
              <p className="text-2xl font-bold">{dailyData?.totalPayments || 0}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Daftar Kunjungan</h3>
            <DataTable
              columns={visitColumns}
              data={dailyData?.visits || []}
              loading={loading}
              emptyTitle="Belum ada kunjungan"
              emptyDescription="Kunjungan hari ini akan muncul di sini"
            />
          </Card>

          {visitStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Total Kunjungan (Periode)</p>
                  <p className="text-2xl font-bold">{visitStats.totalVisits}</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Spesies Terbanyak</p>
                  <p className="text-2xl font-bold">
                    {visitStats.bySpecies.length > 0
                      ? visitStats.bySpecies[0].species
                      : "-"}
                  </p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Kategori Layanan Terbanyak</p>
                  <p className="text-2xl font-bold">
                    {visitStats.byServiceCategory.length > 0
                      ? visitStats.byServiceCategory[0].category
                      : "-"}
                  </p>
                </Card>
              </div>

              {visitStats.byDoctor.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Kunjungan per Dokter</h3>
                  <div className="space-y-2">
                    {visitStats.byDoctor.map((doc) => (
                      <div key={doc.doctorId} className="flex items-center justify-between">
                        <span>{doc.name}</span>
                        <span className="font-medium">{doc.count} kunjungan</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {visitStats.bySpecies.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Kunjungan per Spesies</h3>
                  <div className="space-y-2">
                    {visitStats.bySpecies.map((s) => (
                      <div key={s.species} className="flex items-center justify-between">
                        <span>{s.species}</span>
                        <span className="font-medium">{s.count} kunjungan</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {visitStats.byServiceCategory.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Kunjungan per Kategori Layanan</h3>
                  <div className="space-y-2">
                    {visitStats.byServiceCategory.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <span>{cat.category}</span>
                        <span className="font-medium">{cat.count} kunjungan</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {dailyData?.lowStockProducts && dailyData.lowStockProducts.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-yellow-600">Stok Menipis</h3>
              <div className="space-y-2">
                {dailyData.lowStockProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span>{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Stok: {product.currentStock} (Min: {product.reorderPoint})
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Produk</p>
              <p className="text-2xl font-bold">{inventoryData?.totalProducts || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Stok Menipis</p>
              <p className="text-2xl font-bold text-yellow-600">
                {inventoryData?.lowStock?.length || 0}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Habis Stok</p>
              <p className="text-2xl font-bold text-red-600">
                {inventoryData?.outOfStock?.length || 0}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Daftar Inventaris</h3>
            <DataTable
              columns={inventoryColumns}
              data={inventoryData?.products || []}
              loading={loading}
              emptyTitle="Belum ada data"
              emptyDescription="Data inventaris akan muncul di sini"
            />
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Supplier Aktif</p>
              <p className="text-2xl font-bold">{supplierData.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Pengeluaran (Semua Supplier)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  supplierData.reduce((sum, s) => sum + s.totalSpend, 0)
                )}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Performa Supplier</h3>
            <DataTable
              columns={supplierColumns}
              data={supplierData}
              loading={loading}
              emptyTitle="Belum ada data supplier"
              emptyDescription="Data performa supplier akan muncul di sini"
            />
          </Card>
        </TabsContent>

        <TabsContent value="hotel" className="space-y-4">
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
            <Button onClick={fetchHotelOccupancy} variant="outline">
              Muat Ulang
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Tingkat Okupansi</p>
              <p className="text-2xl font-bold">
                {hotelData?.occupancyRate != null
                  ? hotelData.occupancyRate.toFixed(1)
                  : "0"}
                %
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Pendapatan Hotel</p>
              <p className="text-2xl font-bold">
                {formatCurrency(hotelData?.totalRevenue || 0)}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Rata-rata Lama Menginap</p>
              <p className="text-2xl font-bold">
                {hotelData?.avgLengthOfStay || 0} hari
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Kamar</p>
              <p className="text-2xl font-bold">{hotelData?.totalRooms || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Kamar Terisi</p>
              <p className="text-2xl font-bold">{hotelData?.totalOccupancy || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Kapasitas Total</p>
              <p className="text-2xl font-bold">{hotelData?.totalCapacity || 0}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Ringkasan Booking</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Booking</span>
                <span className="font-medium">{hotelData?.totalBookings || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Booking Aktif</span>
                <span className="font-medium text-blue-600">{hotelData?.activeBookings || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Booking Selesai</span>
                <span className="font-medium text-green-600">{hotelData?.completedBookings || 0}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="diagnosis" className="space-y-4">
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
            <Button onClick={fetchDiagnosis} variant="outline">
              Muat Ulang
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Kunjungan</p>
              <p className="text-2xl font-bold">{diagnosisData?.totalVisits || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Jenis Diagnosa</p>
              <p className="text-2xl font-bold">{diagnosisData?.diagnoses?.length || 0}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Top 10 Diagnosa</h3>
            <DataTable
              columns={[
                {
                  id: "diagnosis",
                  header: "Diagnosa",
                  renderCell: (row: any) => (
                    <span className="font-medium">{row.diagnosis}</span>
                  ),
                },
                {
                  id: "count",
                  header: "Jumlah",
                  renderCell: (row: any) => row.count,
                },
                {
                  id: "percentage",
                  header: "Persentase",
                  renderCell: (row: any) => {
                    const pct =
                      diagnosisData && diagnosisData.totalVisits > 0
                        ? ((row.count / diagnosisData.totalVisits) * 100).toFixed(1)
                        : "0";
                    return `${pct}%`;
                  },
                },
              ]}
              data={diagnosisData?.diagnoses || []}
              loading={loading}
              emptyTitle="Belum ada data diagnosa"
              emptyDescription="Data diagnosa akan muncul di sini"
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
