"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatDateTime } from "@/lib/utils";
import {
  DollarSign,
  Percent,
  Package,
  Truck,
  Calculator,
  Check,
  X,
  Loader2,
} from "lucide-react";

export interface ApprovalCardProps {
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string | Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
  type: "PRICE_CHANGE" | "DISCOUNT" | "STOCK_ADJUSTMENT" | "SUPPLIER" | "RECONCILIATION";
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}

const typeIcons: Record<ApprovalCardProps["type"], React.ReactNode> = {
  PRICE_CHANGE: <DollarSign className="h-4 w-4" />,
  DISCOUNT: <Percent className="h-4 w-4" />,
  STOCK_ADJUSTMENT: <Package className="h-4 w-4" />,
  SUPPLIER: <Truck className="h-4 w-4" />,
  RECONCILIATION: <Calculator className="h-4 w-4" />,
};

const typeLabels: Record<ApprovalCardProps["type"], string> = {
  PRICE_CHANGE: "Perubahan Harga",
  DISCOUNT: "Diskon",
  STOCK_ADJUSTMENT: "Penyesuaian Stok",
  SUPPLIER: "Supplier",
  RECONCILIATION: "Rekonsiliasi",
};

export function ApprovalCard({
  title,
  description,
  requestedBy,
  requestedAt,
  status,
  type,
  onApprove,
  onReject,
  isLoading = false,
}: ApprovalCardProps) {
  return (
    <Card className={cn("overflow-hidden", status !== "PENDING" && "opacity-75")}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-3">
              {typeIcons[type]}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {typeLabels[type]}
              </p>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
              <p className="text-xs text-muted-foreground">
                Diajukan oleh {requestedBy} &middot; {formatDateTime(requestedAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status} />
            {status === "PENDING" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Tolak
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onApprove}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Setujui
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
