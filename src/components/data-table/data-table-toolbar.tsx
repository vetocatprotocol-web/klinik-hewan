"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataTableToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableToolbar({
  children,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}
