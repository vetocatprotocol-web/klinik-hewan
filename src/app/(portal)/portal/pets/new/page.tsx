import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { PortalPetForm } from "./pet-form";

export default async function PortalNewPetPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true, name: true },
  });

  if (!customer) redirect("/login");

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Tambah Hewan</h1>
        <p className="text-sm text-muted-foreground">
          Daftarkan hewan peliharaan baru
        </p>
      </div>
      <PortalPetForm customerId={customer.id} />
    </div>
  );
}
