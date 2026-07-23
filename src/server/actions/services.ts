"use server";

import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { serviceSchema, drugSchema, productSchema, productCategorySchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

// ─── Services ─────────────────────────────────────────────

export async function createService(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    category: formData.get("category") as string,
    price: Number(formData.get("price")),
  };

  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await prisma.service.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama layanan sudah ada", field: "name" } };
  }

  const service = await prisma.service.create({ data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Service",
    entityId: service.id,
  });

  return { success: true, data: service.id };
}

export async function updateService(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    category: formData.get("category") as string,
    price: Number(formData.get("price")),
  };

  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await prisma.service.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Nama layanan sudah ada", field: "name" } };
  }

  await prisma.service.update({ where: { id }, data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Service",
    entityId: id,
  });

  return { success: true, data: id };
}

export async function archiveService(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  await prisma.service.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Service",
    entityId: id,
  });

  return { success: true, data: undefined };
}

// ─── Drugs ────────────────────────────────────────────────

export async function createDrug(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    unit: formData.get("unit") as string,
    pricePerUnit: Number(formData.get("pricePerUnit")),
  };

  const validated = drugSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await prisma.drug.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama obat sudah ada", field: "name" } };
  }

  const drug = await prisma.drug.create({ data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Drug",
    entityId: drug.id,
  });

  return { success: true, data: drug.id };
}

export async function updateDrug(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    unit: formData.get("unit") as string,
    pricePerUnit: Number(formData.get("pricePerUnit")),
  };

  const validated = drugSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await prisma.drug.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Nama obat sudah ada", field: "name" } };
  }

  await prisma.drug.update({ where: { id }, data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Drug",
    entityId: id,
  });

  return { success: true, data: id };
}

export async function archiveDrug(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  await prisma.drug.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Drug",
    entityId: id,
  });

  return { success: true, data: undefined };
}

// ─── Products ─────────────────────────────────────────────

export async function createProduct(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    categoryId: formData.get("categoryId") as string,
    price: Number(formData.get("price")),
    description: (formData.get("description") as string) || undefined,
    barcode: (formData.get("barcode") as string) || undefined,
    currentStock: Number(formData.get("currentStock") || 0),
    reorderPoint: Number(formData.get("reorderPoint") || 10),
  };

  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await prisma.product.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama produk sudah ada", field: "name" } };
  }

  const product = await prisma.product.create({ data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Product",
    entityId: product.id,
  });

  return { success: true, data: product.id };
}

export async function updateProduct(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    categoryId: formData.get("categoryId") as string,
    price: Number(formData.get("price")),
    description: (formData.get("description") as string) || undefined,
    barcode: (formData.get("barcode") as string) || undefined,
    currentStock: Number(formData.get("currentStock") || 0),
    reorderPoint: Number(formData.get("reorderPoint") || 10),
  };

  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await prisma.product.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Nama produk sudah ada", field: "name" } };
  }

  await prisma.product.update({ where: { id }, data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Product",
    entityId: id,
  });

  return { success: true, data: id };
}

export async function archiveProduct(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Product",
    entityId: id,
  });

  return { success: true, data: undefined };
}

// ─── Product Categories ───────────────────────────────────

export async function createProductCategory(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const validated = productCategorySchema.safeParse(data);
  if (!validated.success) {
    const fieldError = validated.error.issues[0];
    return { success: false, error: { message: fieldError.message, field: fieldError.path[0] as string } };
  }

  const existing = await prisma.productCategory.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama kategori sudah ada", field: "name" } };
  }

  const category = await prisma.productCategory.create({ data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ProductCategory",
    entityId: category.id,
  });

  return { success: true, data: category.id };
}

export async function archiveProductCategory(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || ((session.user as any).role !== "OWNER" && (session.user as any).role !== "ADMIN")) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const category = await prisma.productCategory.findUnique({
    where: { id },
    include: { products: { where: { status: "ACTIVE" } } },
  });

  if (category?.products.length && category.products.length > 0) {
    return { success: false, error: { message: "Tidak bisa mengarsipkan kategori dengan produk aktif", code: "BUSINESS_RULE" } };
  }

  await prisma.productCategory.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "ProductCategory",
    entityId: id,
  });

  return { success: true, data: undefined };
}
