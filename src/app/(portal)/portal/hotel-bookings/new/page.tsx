import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/server/lib/prisma";
import { PortalHotelBookingForm } from "./hotel-booking-form";

export default async function PortalNewHotelBookingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customerId = (session.user as any)?.id;

  const customer = await prisma.customer.findUnique({
    where: { userId: customerId },
    select: { id: true, name: true },
  });

  if (!customer) redirect("/login");

  const [pets, rooms] = await Promise.all([
    prisma.pet.findMany({
      where: { customerId: customer.id, status: "ACTIVE" },
      select: { id: true, name: true, species: true },
      orderBy: { name: "asc" },
    }),
    prisma.hotelRoom.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, roomNumber: true, name: true, type: true, dailyRate: true, capacity: true },
      orderBy: { roomNumber: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Kamar Hotel</h1>
        <p className="text-sm text-muted-foreground">
          Pesan kamar hotel untuk hewan peliharaan Anda
        </p>
      </div>
      <PortalHotelBookingForm
        customerId={customer.id}
        pets={pets}
        rooms={rooms}
      />
    </div>
  );
}
