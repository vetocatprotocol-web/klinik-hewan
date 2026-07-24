import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toNumber } from "@/types";
import { Receipt, Download } from "lucide-react";

interface PortalInvoicesProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function PortalInvoicesPage({ searchParams }: PortalInvoicesProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const where: any = { customerId: customer.id };
  if (params.status) where.status = params.status;

  const invoices = await prisma.invoice.findMany({
    where,
    include: { pet: { select: { name: true } } } as any,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice</h1>
        <p className="text-sm text-muted-foreground">Daftar invoice Anda</p>
      </div>

      <form className="flex flex-wrap gap-3">
        <select name="status" defaultValue={params.status || ""} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="UNPAID">Belum Dibayar</option>
          <option value="PARTIAL">Sebagian</option>
          <option value="PAID">Dibayar</option>
        </select>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">Filter</button>
      </form>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada invoice.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice: any) => (
            <Card key={invoice.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/portal/invoices/${invoice.id}`} className="flex-1">
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
                      {invoice.pet && <p className="text-xs text-muted-foreground">{invoice.pet.name}</p>}
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(toNumber(invoice.total))}</p>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <Link
                      href={`/invoices/${invoice.id}/print`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
