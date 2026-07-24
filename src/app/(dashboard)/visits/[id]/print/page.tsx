"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { downloadVisitNotesPdf } from "@/server/actions/visits";

export default function VisitPrintPage() {
  const params = useParams();
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const result = await downloadVisitNotesPdf(params.id as string);
        if (result.success && result.data) {
          setHtml(result.data);
        } else {
          setError(result.success ? "Gagal memuat catatan" : (result.error?.message || "Gagal memuat catatan"));
        }
      } catch {
        setError("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat catatan kunjungan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="w-full min-h-screen border-0"
      title="Catatan Kunjungan"
    />
  );
}
