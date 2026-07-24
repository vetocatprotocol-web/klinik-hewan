import { prisma } from "./prisma";

interface NotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
}

export async function createNotification(params: NotificationParams) {
  try {
    const client = await prisma();
    await client.notification.create({
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
    const client = await prisma();
    await client.notification.createMany({
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

export async function checkLowStock(productId: string) {
  try {
    const client = await prisma();
    const product = await client.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== "ACTIVE") return;
    if (product.currentStock > product.reorderPoint) return;

    const owners = await client.user.findMany({
      where: { role: { name: "OWNER" }, status: "ACTIVE" },
    });
    if (owners.length === 0) return;

    const title = "Stok Menipis";
    const message = `Stok ${product.name} sudah menipis (${product.currentStock} tersisa, reorder point: ${product.reorderPoint}). Segera lakukan pemesanan ulang.`;

    await createBulkNotifications(
      owners.map((o) => o.id),
      title,
      message,
      "warning"
    );

    // Also send email to owners
    try {
      const { sendEmail } = await import("./email");
      for (const owner of owners) {
        if (owner.email) {
          await sendEmail({
            to: owner.email,
            subject: `Peringatan: Stok ${product.name} Menipis`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 20px;">Peringatan Stok Menipis</h1>
                </div>
                <div style="background: #FFFBEB; padding: 30px; border: 1px solid #FDE68A;">
                  <p style="color: #92400E; line-height: 1.6;">Halo ${owner.name},</p>
                  <p style="color: #92400E; line-height: 1.6;">Stok produk berikut sudah menipis dan perlu segera dipesan ulang:</p>
                  <div style="background: white; border: 1px solid #FDE68A; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0; color: #1f2937;">${product.name}</p>
                    <p style="color: #6b7280; margin: 4px 0;">Stok tersisa: <strong>${product.currentStock}</strong></p>
                    <p style="color: #6b7280; margin: 4px 0;">Reorder point: <strong>${product.reorderPoint}</strong></p>
                  </div>
                  <p style="color: #92400E; font-size: 14px;">Silakan lakukan pemesanan ulang segera untuk menghindari kehabisan stok.</p>
                </div>
                <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">Email ini dikirim oleh Klinik Hewan PetCare</p>
                </div>
              </div>
            `,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send low stock email:", emailError);
    }
  } catch (error) {
    console.error("Failed to check low stock:", error);
  }
}
