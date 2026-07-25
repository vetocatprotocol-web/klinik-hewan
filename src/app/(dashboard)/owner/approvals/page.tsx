"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  approvePriceChange,
  rejectPriceChange,
  approveDiscount,
  rejectDiscount,
  approveStockAdjustment,
  rejectStockAdjustment,
} from "@/server/actions/approvals";
import { approveSupplier, rejectSupplier } from "@/server/actions/suppliers";
import { getPendingApprovals } from "@/server/actions/approvals";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, formatCurrency } from "@/lib/utils";

interface ApprovalItem {
  id: string;
  type: string;
  detail: string;
  requestedBy: string;
  value: string;
  status: string;
  date: string;
  entityType?: string;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPendingApprovals();
      if (result.success && result.data) {
        const items: ApprovalItem[] = [];
        const d = result.data;

        for (const item of d.serviceChanges || []) {
          items.push({
            id: item.id,
            type: "Harga",
            detail: `${item.service?.name || ""} - Harga: ${formatCurrency(Number(item.oldPrice))} → ${formatCurrency(Number(item.newPrice))}`,
            requestedBy: item.requester?.name || "-",
            value: formatCurrency(Number(item.newPrice)),
            status: item.status,
            date: item.requestedAt,
            entityType: "service",
          });
        }

        for (const item of d.drugChanges || []) {
          items.push({
            id: item.id,
            type: "Harga",
            detail: `${item.drug?.name || ""} - Harga: ${formatCurrency(Number(item.oldPrice))} → ${formatCurrency(Number(item.newPrice))}`,
            requestedBy: item.requester?.name || "-",
            value: formatCurrency(Number(item.newPrice)),
            status: item.status,
            date: item.requestedAt,
            entityType: "drug",
          });
        }

        for (const item of d.productChanges || []) {
          items.push({
            id: item.id,
            type: "Harga",
            detail: `${item.product?.name || ""} - Harga: ${formatCurrency(Number(item.oldPrice))} → ${formatCurrency(Number(item.newPrice))}`,
            requestedBy: item.requester?.name || "-",
            value: formatCurrency(Number(item.newPrice)),
            status: item.status,
            date: item.requestedAt,
            entityType: "product",
          });
        }

        for (const item of d.discountLogs || []) {
          items.push({
            id: item.id,
            type: "Diskon",
            detail: `${item.invoice?.invoiceNumber || ""} - ${formatCurrency(Number(item.discountAmount))} (${item.discountType || "-"})`,
            requestedBy: item.applier?.name || "-",
            value: formatCurrency(Number(item.discountAmount)),
            status: item.approvalStatus,
            date: item.appliedAt,
            entityType: "discount",
          });
        }

        for (const item of d.stockApprovals || []) {
          items.push({
            id: item.id,
            type: "Stok",
            detail: `${item.adjustment?.product?.name || ""} - Qty: ${item.quantity} (${item.adjustment?.type || "-"})`,
            requestedBy: item.requester?.name || "-",
            value: String(item.quantity),
            status: item.status,
            date: item.requestedAt,
            entityType: "stock",
          });
        }

        for (const item of d.supplierChanges || []) {
          items.push({
            id: item.id,
            type: "Supplier",
            detail: `${item.supplier?.name || ""} - ${item.changeType}: ${JSON.stringify(item.newData || {}).slice(0, 100)}`,
            requestedBy: item.requester?.name || "-",
            value: item.changeType,
            status: item.status,
            date: item.requestedAt,
            entityType: "supplier",
          });
        }

        setData(items);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (item: ApprovalItem) => {
    startTransition(async () => {
      try {
        let result;
        switch (item.entityType) {
          case "service":
          case "drug":
          case "product":
            result = await approvePriceChange(item.id, item.entityType as "service" | "drug" | "product");
            break;
          case "discount":
            result = await approveDiscount(item.id);
            break;
          case "stock":
            result = await approveStockAdjustment(item.id);
            break;
          case "supplier":
            result = await approveSupplier(item.id);
            break;
          default:
            return;
        }
        if (result.success) {
          fetchData();
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  const openRejectDialog = (item: ApprovalItem) => {
    setSelectedItem(item);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        let result;
        switch (selectedItem.entityType) {
          case "service":
          case "drug":
          case "product":
            result = await rejectPriceChange(
              selectedItem.id,
              selectedItem.entityType as "service" | "drug" | "product",
              rejectReason
            );
            break;
          case "discount":
            result = await rejectDiscount(selectedItem.id, rejectReason);
            break;
          case "stock":
            result = await rejectStockAdjustment(selectedItem.id, rejectReason);
            break;
          case "supplier":
            result = await rejectSupplier(selectedItem.id, rejectReason);
            break;
          default:
            return;
        }
        if (result.success) {
          setRejectDialogOpen(false);
          setSelectedItem(null);
          setRejectReason("");
          fetchData();
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  const filteredData =
    activeTab === "all"
      ? data
      : data.filter((item) => {
          switch (activeTab) {
            case "price":
              return item.type === "Harga";
            case "discount":
              return item.type === "Diskon";
            case "stock":
              return item.type === "Stok";
            case "supplier":
              return item.type === "Supplier";
            default:
              return true;
          }
        });

  const columns: ColumnDef<ApprovalItem>[] = [
    {
      id: "type",
      header: "Tipe",
      renderCell: (row) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
          {row.type}
        </span>
      ),
    },
    {
      id: "detail",
      header: "Detail",
      renderCell: (row) => (
        <span className="line-clamp-1 max-w-[300px]">{row.detail}</span>
      ),
    },
    {
      id: "requestedBy",
      header: "Diajukan Oleh",
      renderCell: (row) => row.requestedBy,
    },
    {
      id: "value",
      header: "Nilai",
      renderCell: (row) => row.value,
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "date",
      header: "Tanggal",
      renderCell: (row) => formatDate(row.date),
    },
    {
      id: "actions",
      header: "Aksi",
      className: "text-right",
      renderCell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "PENDING" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApprove(row)}
                disabled={isPending}
              >
                Setujui
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openRejectDialog(row)}
                disabled={isPending}
              >
                Tolak
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Persetujuan</h1>
        <p className="text-sm text-muted-foreground">
          Tinjau dan setujui permintaan perubahan data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="price">Harga</TabsTrigger>
          <TabsTrigger value="discount">Diskon</TabsTrigger>
          <TabsTrigger value="stock">Stok</TabsTrigger>
          <TabsTrigger value="supplier">Supplier</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable
            columns={columns}
            data={filteredData}
            loading={loading}
            emptyTitle="Tidak ada persetujuan"
            emptyDescription="Semua permintaan telah diproses"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Permintaan</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan permintaan ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectReason.trim()}
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
