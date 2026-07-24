import prisma from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
