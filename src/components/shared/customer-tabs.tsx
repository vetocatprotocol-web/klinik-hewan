"use client";

import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface CustomerTabsProps {
  customerId: string;
  pets: any[];
  visits?: any[];
  invoices?: any[];
}

export function CustomerTabs({ customerId, pets, visits = [], invoices = [] }: CustomerTabsProps) {
  return (
    <Tabs defaultValue="pets">
      <TabsList>
        <TabsTrigger value="pets">Hewan ({pets.length})</TabsTrigger>
        <TabsTrigger value="visits">Kunjungan ({visits.length})</TabsTrigger>
        <TabsTrigger value="invoices">Invoice ({invoices.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pets">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Daftar Hewan</CardTitle>
            <Link
              href={`/customers/${customerId}/pets/new`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah Hewan
            </Link>
          </CardHeader>
          <CardContent>
            {pets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada hewan terdaftar
              </p>
            ) : (
              <div className="space-y-2">
                {pets.map((pet: any) => (
                  <Link
                    key={pet.id}
                    href={`/customers/${customerId}/pets/${pet.id}/edit`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{pet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pet.species}{pet.breed ? ` - ${pet.breed}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={pet.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="visits">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Kunjungan</CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada riwayat kunjungan
              </p>
            ) : (
              <div className="space-y-2">
                {visits.map((visit: any) => (
                  <Link
                    key={visit.id}
                    href={`/visits/${visit.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{visit.visitNumber}</p>
                        <StatusBadge status={visit.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {visit.pet?.name} - {visit.diagnosis}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(visit.visitDate)}
                      </p>
                    </div>
                    <Link
                      href={`/visits/${visit.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Lihat
                    </Link>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="invoices">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada invoice
              </p>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice: any) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {invoice.pet?.name} - {formatDate(invoice.invoiceDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {formatCurrency(invoice.total)} | Dibayar: {formatCurrency(invoice.paidAmount)}
                      </p>
                    </div>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Lihat
                    </Link>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
