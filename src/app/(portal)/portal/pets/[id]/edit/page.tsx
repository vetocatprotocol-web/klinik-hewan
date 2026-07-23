import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { PortalPetEditForm } from "./pet-edit-form";

export default async function PortalEditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const pet = await prisma.pet.findFirst({
    where: { id, customerId: customer.id },
  });

  if (!pet) redirect("/portal/pets");

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Ubah Hewan</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui informasi {pet.name}
        </p>
      </div>
      <PortalPetEditForm
        petId={pet.id}
        initialData={{
          name: pet.name,
          species: pet.species,
          breed: pet.breed || "",
          birthDate: pet.birthDate
            ? new Date(pet.birthDate).toISOString().split("T")[0]
            : "",
          weightKg: pet.weightKg ? String(pet.weightKg) : "",
          colorMarking: pet.colorMarking || "",
          medicalHistoryNotes: pet.medicalHistoryNotes || "",
        }}
      />
    </div>
  );
}
