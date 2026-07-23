import prisma from "./prisma";

interface NotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
}

export async function createNotification(params: NotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || "info",
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type?: string
) {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type: type || "info",
      })),
    });
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
  }
}
