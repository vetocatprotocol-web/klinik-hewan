import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.RESEND_FROM_EMAIL || "noreply@klinik.com",
}: SendEmailParams) {
  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export function generateVisitCompletedEmail(data: {
  customerName: string;
  petName: string;
  visitNumber: string;
  diagnosis: string;
  invoiceNumber?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Kunjungan Selesai</h2>
      <p>Halo ${data.customerName},</p>
      <p>Kunjungan hewan peliharaan Anda <strong>${data.petName}</strong> telah selesai.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Nomor Kunjungan:</strong> ${data.visitNumber}</p>
        <p><strong>Diagnosis:</strong> ${data.diagnosis}</p>
        ${data.invoiceNumber ? `<p><strong>Nomor Invoice:</strong> ${data.invoiceNumber}</p>` : ""}
      </div>
      <p>Terima kasih telah mempercayakan perawatan hewan peliharaan Anda kepada kami.</p>
    </div>
  `;
}

export function generateInvoiceEmail(data: {
  customerName: string;
  invoiceNumber: string;
  total: number;
  invoiceUrl: string;
}) {
  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(data.total);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Invoice Baru</h2>
      <p>Halo ${data.customerName},</p>
      <p>Invoice baru telah dibuat untuk Anda.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Nomor Invoice:</strong> ${data.invoiceNumber}</p>
        <p><strong>Total:</strong> ${formattedTotal}</p>
      </div>
      <a href="${data.invoiceUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Lihat Invoice</a>
    </div>
  `;
}

export function generatePaymentConfirmationEmail(data: {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
}) {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(data.amount);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">Pembayaran Diterima</h2>
      <p>Halo ${data.customerName},</p>
      <p>Pembayaran Anda telah berhasil diterima.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Nomor Invoice:</strong> ${data.invoiceNumber}</p>
        <p><strong>Jumlah:</strong> ${formattedAmount}</p>
        <p><strong>Metode:</strong> ${data.paymentMethod}</p>
      </div>
      <p>Terima kasih atas pembayaran Anda.</p>
    </div>
  `;
}
