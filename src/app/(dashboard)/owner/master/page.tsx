import { prisma } from "@/server/lib/prisma";
import { StatCard } from "@/components/cards/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Stethoscope,
  Pill,
  Package,
  Tags,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

async function MasterStats() {
  const client = await prisma();
  const [totalServices, totalDrugs, totalProducts, totalCategories] =
    await Promise.all([
      client.service.count({ where: { status: "ACTIVE" } }),
      client.drug.count({ where: { status: "ACTIVE" } }),
      client.product.count({ where: { status: "ACTIVE" } }),
      client.productCategory.count({ where: { status: "ACTIVE" } }),
    ]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Layanan"
        value={totalServices}
        description="Layanan aktif"
        icon={<Stethoscope className="h-5 w-5 text-primary" />}
      />
      <StatCard
        title="Total Obat"
        value={totalDrugs}
        description="Obat aktif"
        icon={<Pill className="h-5 w-5 text-blue-500" />}
      />
      <StatCard
        title="Total Produk"
        value={totalProducts}
        description="Produk aktif"
        icon={<Package className="h-5 w-5 text-green-500" />}
      />
      <StatCard
        title="Total Kategori"
        value={totalCategories}
        description="Kategori produk"
        icon={<Tags className="h-5 w-5 text-orange-500" />}
      />
    </div>
  );
}

async function QuickLinks() {
  const links = [
    {
      href: "/master/services",
      label: "Layanan",
      icon: Stethoscope,
      description: "Kelola daftar layanan klinik",
    },
    {
      href: "/master/drugs",
      label: "Obat",
      icon: Pill,
      description: "Kelola daftar obat",
    },
    {
      href: "/master/products",
      label: "Produk",
      icon: Package,
      description: "Kelola daftar produk",
    },
    {
      href: "/master/stock",
      label: "Stok",
      icon: TrendingUp,
      description: "Kelola penyesuaian stok",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Akses Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex h-auto flex-col items-start gap-1 p-4 text-left"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <link.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{link.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function RecentChanges() {
  const client = await prisma();
  const [recentServices, recentDrugs, recentProducts] = await Promise.all([
    client.service.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        updatedAt: true,
      },
    }),
    client.drug.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        pricePerUnit: true,
        status: true,
        updatedAt: true,
      },
    }),
    client.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        price: true,
        currentStock: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Layanan Terbaru</CardTitle>
          <Link
            href="/master/services"
            className="text-sm text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </CardHeader>
        <CardContent>
          {recentServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada layanan.</p>
          ) : (
            <div className="space-y-3">
              {recentServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.status === "ACTIVE" ? "Aktif" : "Diarsipkan"}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    Rp {Number(service.price).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Obat Terbaru</CardTitle>
          <Link
            href="/master/drugs"
            className="text-sm text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </CardHeader>
        <CardContent>
          {recentDrugs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada obat.</p>
          ) : (
            <div className="space-y-3">
              {recentDrugs.map((drug) => (
                <div
                  key={drug.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{drug.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {drug.status === "ACTIVE" ? "Aktif" : "Diarsipkan"}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    Rp {Number(drug.pricePerUnit).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Produk Terbaru</CardTitle>
          <Link
            href="/master/products"
            className="text-sm text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </CardHeader>
        <CardContent>
          {recentProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada produk.</p>
          ) : (
            <div className="space-y-3">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stok: {product.currentStock}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    Rp {Number(product.price).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function OwnerMasterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Master Data</h1>
        <p className="text-muted-foreground">
          Kelola layanan, obat, produk, dan kategori
        </p>
      </div>

      <MasterStats />
      <QuickLinks />
      <RecentChanges />
    </div>
  );
}
