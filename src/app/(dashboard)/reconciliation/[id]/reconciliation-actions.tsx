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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { approveReconciliation, requestReconciliationRevision } from "@/server/actions/reconciliation";
import { CheckCircle, Edit } from "lucide-react";

interface ReconciliationActionsProps {
  reconciliationId: string;
}

export function ReconciliationActions({ reconciliationId }: ReconciliationActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleApprove() {
    setLoading("approve");
    const result = await approveReconciliation(reconciliationId);
    setLoading(null);
    if (result.success) {
      toast({ title: "Berhasil", description: "Rekonsiliasi telah disetujui" });
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
    }
  }

  async function handleRevision() {
    if (!revisionNotes.trim()) {
      toast({ title: "Gagal", description: "Catatan revisi wajib diisi", variant: "destructive" });
      return;
    }
    setLoading("revision");
    const result = await requestReconciliationRevision(reconciliationId, revisionNotes);
    setLoading(null);
    if (result.success) {
      toast({ title: "Berhasil", description: "Revisi telah diminta" });
      setRevisionDialogOpen(false);
      setRevisionNotes("");
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error.message, variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full" onClick={handleApprove} disabled={loading === "approve"}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {loading === "approve" ? "Memproses..." : "Setujui"}
        </Button>
        <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              Minta Revisi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Minta Revisi</DialogTitle>
              <DialogDescription>
                Masukkan catatan revisi yang diperlukan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revisionNotes">Catatan Revisi *</Label>
                <Textarea
                  id="revisionNotes"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Jelaskan yang perlu diperbaiki..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
                Kembali
              </Button>
              <Button variant="destructive" onClick={handleRevision} disabled={loading === "revision"}>
                {loading === "revision" ? "Memproses..." : "Kirim Revisi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
