"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Receipt } from "lucide-react";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  status: string;
}

export interface InvoiceCardProps {
  invoice: InvoiceData;
  className?: string;
}

export function InvoiceCard({ invoice, className }: InvoiceCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {invoice.invoiceNumber}
        </CardTitle>
        <StatusBadge status={invoice.status} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Receipt className="h-4 w-4" />
          <span>{formatDate(invoice.invoiceDate)}</span>
        </div>
        <p className="mt-3 text-lg font-semibold">
          {formatCurrency(invoice.total)}
        </p>
      </CardContent>
    </Card>
  );
}
