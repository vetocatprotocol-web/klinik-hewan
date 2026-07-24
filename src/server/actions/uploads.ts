"use server";

import { auth } from "../lib/auth";
import { createSupabaseAdmin } from "../lib/storage";
import { ActionResult } from "@/types";

export async function uploadFile(
  file: File,
  bucket: string = "uploads"
): Promise<ActionResult<{ url: string; path: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: { message: "Tipe file tidak valid. Yang diizinkan: jpg, png, webp, pdf" },
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: { message: "Ukuran file maksimal 5MB" },
    };
  }

  const supabase = createSupabaseAdmin();
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${bucket}/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
    });

  if (error) {
    return { success: false, error: { message: "Gagal mengupload file" } };
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    success: true,
    data: { url: urlData.publicUrl, path: filePath },
  };
}

export async function deleteFile(path: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "ADMIN"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from("uploads").remove([path]);

  if (error) {
    return { success: false, error: { message: "Gagal menghapus file" } };
  }

  return { success: true, data: undefined };
}
