import Link from "next/link";
import { prisma } from "@/server/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  Pill,
  Package,
  Tags,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function OwnerMasterPage() {
  const client = await prisma();

  const [totalServices, totalDrugs, totalProducts, totalCategories] =
    await Promise.all([
      client.service.count({ where: { status: "ACTIVE" } }),
      client.drug.count({ where: { status: "ACTIVE" } }),
      client.product.count({ where: { status: "ACTIVE" } }),
      client.productCategory.count({ where: { status: "ACTIVE" } }),
    ]);

  const [recentServices, recentDrugs, recentProducts] =
    await Promise.all([
      client.service.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, category: true, price: true, updatedAt: true },
      }),
      client.drug.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, unit: true, pricePerUnit: true, updatedAt: true },
      }),
      client.product.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, currentStock: true, price: true, updatedAt: true },
      }),
    ]);

  const statCards = [
    {
      title: "Total Layanan",
      value: totalServices,
      icon: <Stethoscope className="h-5 w-5 text-muted-foreground" />,
      href: "/master/services",
    },
    {
      title: "Total Obat",
      value: totalDrugs,
      icon: <Pill className="h-5 w-5 text-muted-foreground" />,
      href: "/master/drugs",
    },
    {
      title: "Total Produk",
      value: totalProducts,
      icon: <Package className="h-5 w-5 text-muted-foreground" />,
      href: "/master/products",
    },
    {
      title: "Total Kategori",
      value: totalCategories,
      icon: <Tags className="h-5 w-5 text-muted-foreground" />,
      href: "/master/stock",
    },
  ];

  const quickLinks = [
    { title: "Layanan", href: "/master/services", description: "Kelola layanan klinik" },
    { title: "Obat", href: "/master/drugs", description: "Kelola data obat" },
    { title: "Produk", href: "/master/products", description: "Kelola data produk" },
    { title: "Stok", href: "/master/stock", description: "Kelola stok produk" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Master</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan dan pengelolaan data master klinik
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{link.title}</p>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Perubahan Terbaru - Layanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentServices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data layanan
                </p>
              ) : (
                <div className="space-y-2">
                  {recentServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Perubahan Terbaru - Obat
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDrugs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data obat
                </p>
              ) : (
                <div className="space-y-2">
                  {recentDrugs.map((drug) => (
                    <div
                      key={drug.id}
                      className="flex items-center justify-between rounded border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{drug.name}</p>
                        <p className="text-xs text-muted-foreground">{drug.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Perubahan Terbaru - Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data produk
                </p>
              ) : (
                <div className="space-y-2">
                  {recentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stok: {product.currentStock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
