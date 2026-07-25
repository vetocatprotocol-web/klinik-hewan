import { notFound } from "next/navigation";
import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { CancelHotelBookingForm } from "./cancel-form";

interface CancelHotelBookingPageProps {
  params: Promise<{ id: string }>;
}

export default async function CancelHotelBookingPage({
  params,
}: CancelHotelBookingPageProps) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;

  const booking = await prisma.hotelBooking.findFirst({
    where: {
      id,
      customer: { userId: session.user.id },
    },
    include: {
      pet: { select: { name: true, species: true } },
      room: { select: { roomNumber: true, name: true, type: true } },
    },
  });

  if (!booking) notFound();

  if (booking.status !== "CONFIRMED") {
    notFound();
  }

  return (
    <CancelHotelBookingForm
      bookingId={booking.id}
      bookingNumber={booking.bookingNumber}
      roomNumber={booking.room.roomNumber}
      roomName={booking.room.name}
      petName={booking.pet.name}
      petSpecies={booking.pet.species}
      checkInDate={booking.checkInDate.toISOString()}
      checkOutDate={booking.checkOutDate.toISOString()}
      totalDays={booking.totalDays}
    />
  );
}
