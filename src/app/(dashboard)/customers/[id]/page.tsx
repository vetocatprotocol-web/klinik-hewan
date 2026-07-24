import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { getCustomerById } from "@/server/queries/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { CustomerTabs } from "@/components/shared/customer-tabs";
import { cn, formatDate } from "@/lib/utils";
import { Phone, Mail, MapPin, Calendar } from "lucide-react";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await auth();
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const pets = customer.pets.filter((p: any) => p.status === "ACTIVE");

  const [visits, invoices] = await Promise.all([
    prisma.visit.findMany({
      where: { customerId: id },
      include: {
        pet: { select: { name: true } },
        visitItems: {
          include: {
            service: { select: { name: true } },
            drug: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.invoice.findMany({
      where: { customerId: id },
      include: {
        pet: { select: { name: true } },
        invoiceItems: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            Detail pelanggan
          </p>
        </div>
        <Link
          href={`/customers/${id}/edit`}
          className={cn(buttonVariants())}
        >
          Ubah Pelanggan
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informasi Pelanggan</span>
                <StatusBadge status={customer.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email || "-"}</span>
                </div>
              </div>
              {customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.postalCode && ` ${customer.postalCode}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Terdaftar sejak {formatDate(customer.createdAt)}
                </span>
              </div>
              {customer.notes && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  {customer.notes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Hewan</span>
                <span className="font-medium">{pets.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status Akun</span>
                <StatusBadge status={customer.user?.status || "INACTIVE"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CustomerTabs customerId={id} pets={pets} visits={visits} invoices={invoices} />
    </div>
  );
}
