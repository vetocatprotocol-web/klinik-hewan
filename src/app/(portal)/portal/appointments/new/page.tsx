import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { PortalAppointmentForm } from "./appointment-form";

export default async function PortalNewAppointmentPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true, name: true },
  });

  if (!customer) redirect("/login");

  const [pets, doctors] = await Promise.all([
    prisma.pet.findMany({
      where: { customerId: customer.id, status: "ACTIVE" },
      select: { id: true, name: true, species: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { name: "DOKTER" }, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Buat Janji Temu</h1>
        <p className="text-sm text-muted-foreground">
          Buat janji temu baru untuk hewan Anda
        </p>
      </div>
      <PortalAppointmentForm
        customerId={customer.id}
        pets={pets}
        doctors={doctors}
      />
    </div>
  );
}
