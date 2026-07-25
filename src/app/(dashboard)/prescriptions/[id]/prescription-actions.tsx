"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completePrescription, cancelPrescription } from "@/server/actions/prescriptions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface PrescriptionActionsProps {
  prescriptionId: string;
  status: string;
}

export function PrescriptionActions({
  prescriptionId,
  status,
}: PrescriptionActionsProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const result = await completePrescription(prescriptionId);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const result = await cancelPrescription(prescriptionId, cancelReason);
      if (result.success) {
        setCancelDialogOpen(false);
        setCancelReason("");
        router.refresh();
      }
    } finally {
      setCancelling(false);
    }
  };

  if (status !== "ACTIVE") {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={handleComplete}
          disabled={completing}
        >
          {completing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Selesaikan Resep
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setCancelDialogOpen(true)}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Batalkan Resep
        </Button>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Resep</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Pembatalan *</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Masukkan alasan pembatalan"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling || !cancelReason.trim()}
            >
              {cancelling ? "Membatalkan..." : "Batalkan Resep"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
