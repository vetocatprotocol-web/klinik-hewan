import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import {
  getDashboardStats,
  getRecentTransactions,
  getPendingActions,
  getVisitChart7Days,
  getRevenueChart30Days,
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
  FileWarning,
  ShoppingCart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";

async function DashboardContent() {
  const session = await auth();
  if (!session) redirect("/login");

  const [stats, recent, pending, visitChart, revenueChart] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions(),
    getPendingActions(),
    getVisitChart7Days(),
    getRevenueChart30Days(),
  ]);

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
            <CardTitle className="text-base">Kunjungan (7 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <VisitsChart data={visitChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendapatan (30 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueChart} />
          </CardContent>
        </Card>
      </div>

      {(pending.unpaidInvoices.length > 0 || pending.incompleteVisits.length > 0 || pending.lowStockProducts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi yang Perlu Ditindak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pending.unpaidInvoices.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-amber-500" />
                  Invoice Belum Dibayar ({pending.unpaidInvoices.length})
                </p>
                <div className="space-y-2">
                  {pending.unpaidInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50 text-sm"
                    >
                      <span>{inv.invoiceNumber} - {inv.customer.name}</span>
                      <span className="font-medium">{formatCurrency(Number(inv.total))}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {pending.incompleteVisits.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Kunjungan Belum Selesai ({pending.incompleteVisits.length})
                </p>
                <div className="space-y-2">
                  {pending.incompleteVisits.map((v) => (
                    <Link
                      key={v.id}
                      href={`/visits/${v.id}`}
                      className="flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50 text-sm"
                    >
                      <span>{v.visitNumber} - {v.customer.name} ({v.pet.name})</span>
                      <StatusBadge status={v.status} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {pending.lowStockProducts.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-orange-500" />
                  Stok Menipis ({pending.lowStockProducts.length})
                </p>
                <div className="space-y-2">
                  {pending.lowStockProducts.map((p) => (
                    <Link
                      key={p.id}
                      href="/master/stock"
                      className="flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50 text-sm"
                    >
                      <span>{p.name}</span>
                      <span className="text-orange-600 font-medium">{p.currentStock} / {p.reorderPoint}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.recentVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
          ) : (
            <div className="space-y-3">
              {recent.recentVisits.map((visit: any) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{visit.visitNumber}</p>
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
