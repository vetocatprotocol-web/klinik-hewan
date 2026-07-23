import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, PawPrint } from "lucide-react";

export default async function PortalPetsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true },
  });

  if (!customer) redirect("/login");

  const pets = await prisma.pet.findMany({
    where: { customerId: customer.id, status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hewan Saya</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data hewan peliharaan Anda
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/pets/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Hewan
          </Link>
        </Button>
      </div>

      {pets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PawPrint className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Belum ada hewan terdaftar.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/portal/pets/new">Tambah Hewan Pertama</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet: any) => (
            <Link key={pet.id} href={`/portal/pets/${pet.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-muted p-3">
                    <PawPrint className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pet.species}
                      {pet.breed ? ` - ${pet.breed}` : ""}
                    </p>
                    {pet.weightKg && (
                      <p className="text-xs text-muted-foreground">
                        {pet.weightKg} kg
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
