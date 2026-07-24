import { notFound } from "next/navigation";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { generateInvoiceHtml } from "@/server/lib/pdf";

interface PortalInvoicePrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortalInvoicePrintPage({ params }: PortalInvoicePrintPageProps) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      customer: { userId: session.user.id },
    },
    select: { id: true },
  });

  if (!invoice) notFound();

  const html = await generateInvoiceHtml(invoice.id);

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
