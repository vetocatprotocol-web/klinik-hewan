"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, cn } from "@/lib/utils";
import { PawPrint } from "lucide-react";

export interface VisitData {
  visitNumber: string;
  visitDate: string;
  pet: {
    name: string;
  };
  diagnosis: string;
  status: string;
}

export interface VisitCardProps {
  visit: VisitData;
  className?: string;
}

export function VisitCard({ visit, className }: VisitCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {visit.visitNumber}
        </CardTitle>
        <StatusBadge status={visit.status} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PawPrint className="h-4 w-4" />
          <span>{visit.pet.name}</span>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {formatDate(visit.visitDate)}
        </div>
        <p className="mt-2 text-sm line-clamp-2">{visit.diagnosis}</p>
      </CardContent>
    </Card>
  );
}
