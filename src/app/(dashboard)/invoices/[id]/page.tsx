import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Printer, Mail } from "lucide-react";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: true,
      invoiceItems: true,
    },
  });

  if (!invoice) notFound();

  const payments = await prisma.payment.findMany({
    where: { payableType: "Invoice", payableId: invoice.id },
    orderBy: { createdAt: "desc" },
  });

  const settingsRaw = await prisma.setting.findMany();
  const settings = settingsRaw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, any>);
  const companyInfo = (settings.company_info as any) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(invoice.invoiceDate)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <StatusBadge status={invoice.status} />
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Cetak</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-bold">{companyInfo.name || "Klinik Hewan"}</h2>
                  <p className="text-sm text-muted-foreground">{companyInfo.address || ""}</p>
                  <p className="text-sm text-muted-foreground">{companyInfo.phone || ""}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold">INVOICE</h3>
                  <p className="text-sm">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(invoice.invoiceDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detail Tagihan</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 text-sm">
                <p><span className="text-muted-foreground">Pelanggan:</span> {invoice.customer.name}</p>
                <p><span className="text-muted-foreground">Telepon:</span> {invoice.customer.phone}</p>
                {invoice.pet && <p><span className="text-muted-foreground">Hewan:</span> {invoice.pet.name}</p>}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Harga</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.itemName}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="py-2 text-right">{formatCurrency(Number(item.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 space-y-1 text-sm text-right">
                <p>Subtotal: {formatCurrency(Number(invoice.subtotal))}</p>
                {Number(invoice.taxAmount) > 0 && <p>Pajak: {formatCurrency(Number(invoice.taxAmount))}</p>}
                {Number(invoice.discountAmount) > 0 && <p>Diskon: -{formatCurrency(Number(invoice.discountAmount))}</p>}
                <p className="text-lg font-bold border-t pt-1">Total: {formatCurrency(Number(invoice.total))}</p>
                <p className="text-muted-foreground">Dibayar: {formatCurrency(Number(invoice.paidAmount))}</p>
                {Number(invoice.total) - Number(invoice.paidAmount) > 0 && (
                  <p className="text-destructive font-bold">Sisa: {formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pembayaran</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada pembayaran</p>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded border p-3 text-sm">
                    <div className="flex justify-between">
                      <span>{payment.paymentNumber}</span>
                      <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{payment.paymentMethod} - {formatDateTime(payment.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
