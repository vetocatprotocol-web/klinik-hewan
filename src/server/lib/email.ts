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

export function generateCustomerRegistrationEmail(data: {
  customerName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Klinik Hewan PetCare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">Selamat Datang!</h2>
        <p style="color: #4b5563; line-height: 1.6;">Halo ${data.customerName},</p>
        <p style="color: #4b5563; line-height: 1.6;">Akun portal Anda telah dibuat. Anda dapat menggunakan portal untuk melihat riwayat kunjungan, resep obat, dan invoice hewan peliharaan Anda.</p>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Informasi Akun:</h3>
          <p style="color: #4b5563; margin: 8px 0;"><strong>Email:</strong> ${data.email}</p>
          <p style="color: #4b5563; margin: 8px 0;"><strong>Password Sementara:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${data.tempPassword}</code></p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.loginUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Login ke Portal
          </a>
        </div>

        <p style="color: #dc2626; font-size: 14px; line-height: 1.6;"><strong>Penting:</strong> Silakan ubah password Anda setelah login pertama untuk keamanan akun.</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Jika Anda tidak membuat akun ini, abaikan email ini.</p>
      </div>
      <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Email ini dikirim oleh Klinik Hewan PetCare</p>
      </div>
    </div>
  `;
}

export function generateNewCustomerNotificationEmail(data: {
  customerName: string;
  customerPhone: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Pelanggan Baru Terdaftar</h2>
      <p>Pelanggan baru telah terdaftar di sistem:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Nama:</strong> ${data.customerName}</p>
        <p><strong>Telepon:</strong> ${data.customerPhone}</p>
      </div>
      <p>Silakan periksa data pelanggan di dashboard.</p>
    </div>
  `;
}

export function generateLowStockEmail(data: {
  products: { name: string; currentStock: number; reorderPoint: number }[];
}) {
  const productList = data.products
    .map(
      (p) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.currentStock}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.reorderPoint}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F59E0B;">Peringatan Stok Menipis</h2>
      <p>Beberapa produk memiliki stok di bawah batas minimum:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; text-align: left;">Produk</th>
            <th style="padding: 8px; text-align: center;">Stok Saat Ini</th>
            <th style="padding: 8px; text-align: center;">Batas Minimum</th>
          </tr>
        </thead>
        <tbody>${productList}</tbody>
      </table>
      <p>Silakan lakukan restok segera untuk menghindari kehabisan stok.</p>
    </div>
  `;
}

export function generateDailySummaryEmail(data: {
  date: string;
  totalVisits: number;
  totalRevenue: number;
  totalPayments: number;
  lowStockCount: number;
}) {
  const formattedRevenue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(data.totalRevenue);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Ringkasan Harian - ${data.date}</h2>
      <p>Berikut ringkasan aktivitas klinik hari ini:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Total Kunjungan:</strong> ${data.totalVisits}</p>
        <p><strong>Total Pendapatan:</strong> ${formattedRevenue}</p>
        <p><strong>Total Pembayaran:</strong> ${data.totalPayments}</p>
        ${data.lowStockCount > 0 ? `<p style="color: #F59E0B;"><strong>Stok Menipis:</strong> ${data.lowStockCount} produk</p>` : ""}
      </div>
      <p>Semoga harimu menyenangkan!</p>
    </div>
  `;
}
