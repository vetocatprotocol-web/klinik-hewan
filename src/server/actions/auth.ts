"use server";

import { auth } from "../lib/auth";
import { loginSchema } from "@/lib/validators";
import { signIn, signOut } from "../lib/auth";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { ActionResult } from "@/types";

export async function login(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return {
      success: false,
      error: { message: "Email dan password harus diisi", field: "email" },
    };
  }

  // Check if account is locked before attempting signIn
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (user && user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      success: false,
      error: { message: `Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft} menit.` },
    };
  }

  // If lockout has expired, reset the counter
  if (user && user.lockedUntil && user.lockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  try {
    const staffRoles = ["OWNER", "DOKTER", "KASIR", "ADMIN"];
    await signIn("credentials", {
      email,
      password,
      redirectTo: staffRoles.includes(user?.role?.name || "") ? "/dashboard" : "/portal/dashboard",
    });

    return { success: true, data: undefined };
  } catch (error: any) {
    if (error?.type === "CredentialsSignin") {
      // Increment failed login attempts
      if (user) {
        const newAttempts = user.failedLoginAttempts + 1;
        const updateData: any = { failedLoginAttempts: newAttempts };
        if (newAttempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await prisma.user.update({ where: { id: user.id }, data: updateData });
      }
      return {
        success: false,
        error: { message: "Email atau password salah" },
      };
    }
    if (error?.message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return {
      success: false,
      error: { message: "Terjadi kesalahan. Silakan coba lagi." },
    };
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function getSession() {
  const session = await auth();
  return session;
}

export async function forgotPassword(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  if (!email) {
    return { success: false, error: { message: "Email harus diisi", field: "email" } };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success even if user doesn't exist (prevent email enumeration)
    return { success: true, data: undefined };
  }

  // Generate secure token
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour expiry per PRD §14.3

  // Store token in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expires,
    },
  });

  // Send reset email with link
  try {
    const { sendEmail } = await import("../lib/email");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Password - Klinik Hewan PetCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Klinik Hewan PetCare</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">Reset Password</h2>
            <p style="color: #4b5563; line-height: 1.6;">Halo ${user.name},</p>
            <p style="color: #4b5563; line-height: 1.6;">Kami menerima permintaan untuk reset password akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Link ini akan kedaluwarsa dalam 24 jam.</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.</p>
          </div>
          <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Email ini dikirim oleh Klinik Hewan PetCare</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send reset email:", error);
    return { success: false, error: { message: "Gagal mengirim email reset. Silakan coba lagi." } };
  }

  return { success: true, data: undefined };
}

export async function resetPassword(
  token: string,
  email: string,
  newPassword: string
): Promise<ActionResult> {
  if (!token || !email || !newPassword) {
    return { success: false, error: { message: "Data tidak lengkap" } };
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return { success: false, error: { message: "Password minimal 8 karakter" } };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { success: false, error: { message: "Password harus mengandung huruf besar" } };
  }
  if (!/[a-z]/.test(newPassword)) {
    return { success: false, error: { message: "Password harus mengandung huruf kecil" } };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { success: false, error: { message: "Password harus mengandung angka" } };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: { message: "User tidak ditemukan" } };
  }

  // Validate token
  if (!user.resetToken || user.resetToken !== token) {
    return { success: false, error: { message: "Token tidak valid" } };
  }

  // Check token expiry
  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { success: false, error: { message: "Token sudah kedaluwarsa. Silakan minta reset password baru." } };
  }

  // Hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  return { success: true, data: undefined };
}
