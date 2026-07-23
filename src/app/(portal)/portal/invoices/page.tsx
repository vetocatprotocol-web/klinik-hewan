import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toNumber } from "@/types";
import { Download, Receipt } from "lucide-react";

export default async function PortalInvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id },
    include: {
      pet: { select: { name: true } },
    } as any,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Daftar invoice Anda
        </p>
      </div>

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
            <Card key={invoice.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(invoice.invoiceDate)}
                  </p>
                  {invoice.pet && (
                    <p className="text-xs text-muted-foreground">
                      {invoice.pet.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(toNumber(invoice.total))}
                    </p>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="mr-1 h-3 w-3" />
                    Unduh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
