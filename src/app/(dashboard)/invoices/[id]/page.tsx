import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoiceById, getSettings } from "@/server/queries";
import { auth } from "@/server/lib/auth";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toNumber } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Printer, Mail, CreditCard } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  UNPAID: {
    label: "Belum Dibayar",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  PARTIAL: {
    label: "Sebagian",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  PAID: {
    label: "Dibayar",
    className: "bg-green-100 text-green-800 border-green-200",
  },
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const [invoice, settings] = await Promise.all([
    getInvoiceById(id),
    getSettings(),
  ]);

  if (!invoice) {
    notFound();
  }

  const statusInfo = statusConfig[invoice.status] || statusConfig.UNPAID;
  const clinicName = settings.company_name || settings.name || "Klinik Hewan";
  const clinicAddress = settings.company_address || settings.address || "";
  const clinicPhone = settings.company_phone || settings.phone || "";
  const clinicEmail = settings.company_email || settings.email || "";

  const subtotal = invoice.invoiceItems.reduce(
    (sum: number, item: { subtotal: number | string }) => sum + toNumber(item.subtotal),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Detail invoice
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
          {invoice.customer.email && (
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          )}
          {invoice.status !== "PAID" && (
            <Link href={`/invoices/${id}#payment`}>
              <Button size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Proses Pembayaran
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{clinicName}</h2>
                  {clinicAddress && (
                    <p className="text-sm text-muted-foreground">
                      {clinicAddress}
                    </p>
                  )}
                  {clinicPhone && (
                    <p className="text-sm text-muted-foreground">
                      Telp: {clinicPhone}
                    </p>
                  )}
                  {clinicEmail && (
                    <p className="text-sm text-muted-foreground">
                      {clinicEmail}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={statusInfo.className}
                >
                  {statusInfo.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">No. Invoice</p>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Invoice</p>
                  <p className="font-medium">
                    {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-muted-foreground">Jatuh Tempo</p>
                    <p className="font-medium">
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Item</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoiceItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(toNumber(item.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(toNumber(item.subtotal))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {toNumber(invoice.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak</span>
                    <span>{formatCurrency(toNumber(invoice.taxAmount))}</span>
                  </div>
                )}
                {toNumber(invoice.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Diskon</span>
                    <span>
                      -{formatCurrency(toNumber(invoice.discountAmount))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(toNumber(invoice.total))}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Sudah Dibayar</span>
                  <span>{formatCurrency(toNumber(invoice.paidAmount))}</span>
                </div>
                {toNumber(invoice.total) - toNumber(invoice.paidAmount) > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Sisa Tagihan</span>
                    <span>
                      {formatCurrency(
                        toNumber(invoice.total) - toNumber(invoice.paidAmount)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Nama</p>
                <Link
                  href={`/customers/${invoice.customer.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {invoice.customer.name}
                </Link>
              </div>
              {invoice.customer.phone && (
                <div>
                  <p className="text-muted-foreground">Telepon</p>
                  <p className="font-medium">{invoice.customer.phone}</p>
                </div>
              )}
              {invoice.customer.email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{invoice.customer.email}</p>
                </div>
              )}
              {invoice.pet && (
                <div>
                  <p className="text-muted-foreground">Hewan</p>
                  <p className="font-medium">{invoice.pet.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada pembayaran
                </p>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {formatCurrency(toNumber(payment.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.paymentMethod} &mdash;{" "}
                            {formatDateTime(payment.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Dibayar
                        </Badge>
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
