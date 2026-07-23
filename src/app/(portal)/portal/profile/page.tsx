import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { ProfileForm } from "./profile-form";

export default async function PortalProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
    },
  });

  if (!customer) redirect("/login");

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi profil Anda
        </p>
      </div>
      <ProfileForm
        customerId={customer.id}
        initialData={{
          name: customer.name,
          phone: customer.phone,
          email: customer.email || "",
          address: customer.address || "",
        }}
      />
    </div>
  );
}
