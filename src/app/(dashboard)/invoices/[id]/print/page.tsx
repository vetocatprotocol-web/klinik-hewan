"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { generateInvoiceHtml } from "@/server/lib/pdf";

export default function InvoicePrintPage() {
  const params = useParams();
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const id = params.id as string;
    generateInvoiceHtml(id)
      .then((result) => {
        setHtml(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Gagal memuat invoice");
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        srcDoc={html}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Invoice Print View"
      />
    </div>
  );
}
