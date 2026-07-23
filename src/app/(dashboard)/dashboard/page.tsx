import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import {
  getDashboardStats,
  getRecentTransactions,
} from "@/server/queries";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { StatCard } from "@/components/cards/stat-card";
import { VisitsChart } from "@/components/charts/visits-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { Suspense } from "react";
import {
  CalendarCheck,
  CircleDollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

async function DashboardContent() {
  const session = await auth();
  if (!session) redirect("/login");

  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions(),
  ]);

  const visitChartData = recent.recentVisits.map((v: (typeof recent.recentVisits)[number]) => ({
    label: v.visitNumber,
    value: 1,
  }));

  const revenueChartData = recent.recentPayments.map((p: (typeof recent.recentPayments)[number]) => ({
    label: formatShortDate(p.createdAt),
    value: Number(p.amount),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang kembali, {session.user?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Kunjungan Hari Ini"
          value={stats.todayVisits}
          description="Kunjungan tercatat hari ini"
          icon={<CalendarCheck className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Pendapatan Hari Ini"
          value={formatCurrency(stats.todayRevenue)}
          description="Total pendapatan hari ini"
          icon={<CircleDollarSign className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Pembayaran Tertunda"
          value={stats.pendingPayments}
          description="Invoice belum dibayar"
          icon={<Clock className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Stok Menipis"
          value={stats.lowStockProducts}
          description="Produk perlu restok"
          icon={<AlertTriangle className="h-5 w-5 text-primary" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kunjungan Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <VisitsChart data={visitChartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendapatan Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueChartData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.recentVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada transaksi.
            </p>
          ) : (
            <div className="space-y-3">
              {recent.recentVisits.map((visit: any) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {visit.visitNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {visit.customer.name} &mdash; {visit.pet.name}
                    </p>
                  </div>
                  <StatusBadge status={visit.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
