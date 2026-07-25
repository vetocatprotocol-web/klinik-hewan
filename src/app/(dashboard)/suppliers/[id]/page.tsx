import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupplierById } from "@/server/actions/suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MapPin, Edit } from "lucide-react";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = await params;
  const supplier = await getSupplierById(id);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            Detail supplier
          </p>
        </div>
        <StatusBadge status={supplier.status} />
        <Link
          href={`/suppliers/${id}/edit`}
          className={cn(buttonVariants())}
        >
          <Edit className="mr-2 h-4 w-4" />
          Ubah Supplier
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.email}</span>
                  </div>
                )}
              </div>
              {supplier.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    {supplier.address}
                    {supplier.city && `, ${supplier.city}`}
                    {supplier.postalCode && ` ${supplier.postalCode}`}
                  </span>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {supplier.contactPerson && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kontak Person</p>
                    <p className="text-sm font-medium">{supplier.contactPerson}</p>
                  </div>
                )}
                {supplier.specialization && (
                  <div>
                    <p className="text-sm text-muted-foreground">Spesialisasi</p>
                    <p className="text-sm font-medium">{supplier.specialization}</p>
                  </div>
                )}
                {supplier.paymentTerms && (
                  <div>
                    <p className="text-sm text-muted-foreground">Syarat Pembayaran</p>
                    <p className="text-sm font-medium">{supplier.paymentTerms}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Riwayat Purchase Order</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {supplier._count.purchaseOrders} total PO
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supplier.purchaseOrders.length > 0 ? (
                <div className="space-y-2">
                  {supplier.purchaseOrders.map((po) => (
                    <div key={po.id} className="flex items-center justify-between rounded border p-3 text-sm">
                      <div>
                        <p className="font-medium">{po.poNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(po.orderDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(Number(po.totalAmount))}</p>
                        <StatusBadge status={po.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada riwayat purchase order
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchase Order</p>
                <p className="text-2xl font-bold">{supplier._count.purchaseOrders}</p>
              </div>
              {supplier.verifiedBy && (
                <div>
                  <p className="text-sm text-muted-foreground">Diverifikasi Oleh</p>
                  <p className="text-sm font-medium">{supplier.verifiedBy}</p>
                </div>
              )}
              {supplier.verifiedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Verifikasi</p>
                  <p className="text-sm">{formatDate(supplier.verifiedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
