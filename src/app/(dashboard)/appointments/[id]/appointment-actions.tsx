"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { confirmAppointment, completeAppointment, cancelAppointment, markNoShow } from "@/server/actions/appointments";
import { CheckCircle, XCircle, Ban } from "lucide-react";

interface AppointmentActionsProps {
  appointmentId: string;
  status: string;
}

export function AppointmentActions({ appointmentId, status }: AppointmentActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [noShowReason, setNoShowReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading("confirm");
    const result = await confirmAppointment(appointmentId);
    setLoading(null);
    if (result.success) {
      toast({ title: "Berhasil", description: "Janji temu telah dikonfirmasi" });
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
    }
  }

  async function handleComplete() {
    setLoading("complete");
    const result = await completeAppointment(appointmentId);
    setLoading(null);
    if (result.success) {
      toast({ title: "Berhasil", description: "Janji temu telah selesai" });
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
    }
  }

  async function handleCancel() {
    setLoading("cancel");
    const result = await cancelAppointment(appointmentId, cancelReason || undefined);
    setLoading(null);
    if (result.success) {
      toast({ title: "Berhasil", description: "Janji temu telah dibatalkan" });
      setCancelDialogOpen(false);
      setCancelReason("");
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
    }
  }

  async function handleNoShow() {
    setLoading("noShow");
    const result = await markNoShow(appointmentId, noShowReason || undefined);
    setLoading(null);
    if (result.success) {
      toast({ title: "Berhasil", description: "Janji temu ditandai tidak hadir" });
      setNoShowDialogOpen(false);
      setNoShowReason("");
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-2">
      {status === "PENDING" && (
        <Button className="w-full" onClick={handleConfirm} disabled={loading === "confirm"}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {loading === "confirm" ? "Memproses..." : "Konfirmasi"}
        </Button>
      )}
      {status === "CONFIRMED" && (
        <Button className="w-full" onClick={handleComplete} disabled={loading === "complete"}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {loading === "complete" ? "Memproses..." : "Selesai"}
        </Button>
      )}
      {status !== "CANCELLED" && status !== "COMPLETED" && status !== "NO_SHOW" && (
        <>
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <XCircle className="mr-2 h-4 w-4" />
                Batalkan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Batalkan Janji Temu</DialogTitle>
                <DialogDescription>
                  Masukkan alasan pembatalan (opsional)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cancelReason">Alasan</Label>
                  <Textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Alasan pembatalan..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  Kembali
                </Button>
                <Button variant="destructive" onClick={handleCancel} disabled={loading === "cancel"}>
                  {loading === "cancel" ? "Memproses..." : "Batalkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={noShowDialogOpen} onOpenChange={setNoShowDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Ban className="mr-2 h-4 w-4" />
                Tidak Hadir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tandai Tidak Hadir</DialogTitle>
                <DialogDescription>
                  Masukkan alasan (opsional)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="noShowReason">Alasan</Label>
                  <Textarea
                    id="noShowReason"
                    value={noShowReason}
                    onChange={(e) => setNoShowReason(e.target.value)}
                    placeholder="Alasan tidak hadir..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNoShowDialogOpen(false)}>
                  Kembali
                </Button>
                <Button variant="destructive" onClick={handleNoShow} disabled={loading === "noShow"}>
                  {loading === "noShow" ? "Memproses..." : "Tandai Tidak Hadir"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
