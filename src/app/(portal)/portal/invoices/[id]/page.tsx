import { notFound } from "next/navigation";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";

interface PortalInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortalInvoiceDetailPage({ params }: PortalInvoiceDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      customer: {
        userId: session.user.id,
      },
    },
    include: {
      customer: true,
      pet: true,
      invoiceItems: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const payments = await prisma.payment.findMany({
    where: {
      payableType: "Invoice",
      payableId: invoice.id,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPaid = payments.reduce(
    (sum: number, p: any) => sum + (p.status === "PAID" ? Number(p.amount) : 0),
    0
  );
  const remaining = Number(invoice.total) - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal/invoices" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Detail invoice
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
          <Link href={`/invoices/${invoice.id}/print`} target="_blank">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Invoice</p>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{invoice.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hewan</p>
                  <p className="font-medium">{invoice.pet?.name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Item Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoice.invoiceItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pajak</span>
                  <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                </div>
              )}
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diskon</span>
                  <span>-{formatCurrency(Number(invoice.discountAmount))}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(Number(invoice.total))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dibayar</span>
                <span className="text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sisa</span>
                  <span className="text-red-600">{formatCurrency(remaining)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Riwayat Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{payment.paymentNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.createdAt)} - {payment.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <StatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
