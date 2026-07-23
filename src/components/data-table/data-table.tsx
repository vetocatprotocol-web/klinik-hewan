"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export interface ColumnDef<TData> {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  className?: string;
  renderCell?: (row: TData, index: number) => React.ReactNode;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  pagination?: PaginationInfo;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

function getCellValue<TData>(
  row: TData,
  column: ColumnDef<TData>
): React.ReactNode {
  if (column.renderCell) return null;
  if (column.accessorKey) {
    const value = row[column.accessorKey];
    if (value === null || value === undefined) return "-";
    return String(value);
  }
  return "-";
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
}: DataTableProps<TData>) {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id} className={cn(column.className)}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column) => (
              <TableCell key={column.id} className={cn(column.className)}>
                {column.renderCell
                  ? column.renderCell(row, rowIndex)
                  : getCellValue(row, column)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
