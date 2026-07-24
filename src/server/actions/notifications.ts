"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { ActionResult } from "@/types";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  return prisma.notification.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) {
    return { success: false, error: { message: "Notifikasi tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (notification.userId !== session.user.id) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true, data: undefined };
}

export async function markAllAsRead(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id!, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true, data: undefined };
}

export async function cleanupOldNotifications(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.notification.deleteMany({
    where: { createdAt: { lt: sevenDaysAgo } },
  });
}

export async function cleanupOldAuditLogs(): Promise<void> {
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: twelveMonthsAgo } },
  });
}
