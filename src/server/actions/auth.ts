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

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      return {
        success: false,
        error: { message: "Email atau password salah" },
      };
    }

    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error: { message: "Akun Anda tidak aktif" },
      };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return {
        success: false,
        error: { message: "Email atau password salah" },
      };
    }

    const staffRoles = ["OWNER", "DOKTER", "KASIR", "ADMIN"];
    await signIn("credentials", {
      email,
      password,
      redirectTo: staffRoles.includes(user.role.name) ? "/dashboard" : "/portal/dashboard",
    });

    return { success: true, data: undefined };
  } catch (error: any) {
    if (error?.type === "CredentialsSignin") {
      return {
        success: false,
        error: { message: "Email atau password salah" },
      };
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
