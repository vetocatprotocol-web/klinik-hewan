"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { serviceSchema, drugSchema, productSchema, productCategorySchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

const MASTER_ROLES = ["OWNER"];

// ─── Services ─────────────────────────────────────────────

export async function createService(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.service.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama layanan sudah ada", field: "name" } };
  }

  const service = await client.service.create({ data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Service",
    entityId: service.id,
    changes: { name: { old: null, new: data.name }, price: { old: null, new: data.price } },
  });

  return { success: true, data: service.id };
}

export async function updateService(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.service.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Nama layanan sudah ada", field: "name" } };
  }

  const oldService = await client.service.findUnique({ where: { id } });
  if (!oldService) {
    return { success: false, error: { message: "Layanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  await client.service.update({ where: { id }, data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Service",
    entityId: id,
    changes: {
      name: { old: oldService.name, new: data.name },
      price: { old: Number(oldService.price), new: data.price },
      category: { old: oldService.category, new: data.category },
    },
  });

  return { success: true, data: id };
}

export async function archiveService(id: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const service = await client.service.findUnique({
    where: { id },
    include: {
      visitItems: { where: { visit: { status: { in: ["DRAFT", "COMPLETED"] } } }, take: 1 },
    },
  });

  if (!service) {
    return { success: false, error: { message: "Layanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (service.status === "ARCHIVED") {
    return { success: false, error: { message: "Layanan sudah diarsipkan", code: "BUSINESS_RULE" } };
  }

  if (service.visitItems.length > 0) {
    return { success: false, error: { message: "Tidak bisa mengarsipkan layanan yang sedang digunakan dalam kunjungan aktif", code: "BUSINESS_RULE" } };
  }

  await client.service.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Service",
    entityId: id,
    changes: { status: { old: "ACTIVE", new: "ARCHIVED" } },
  });

  return { success: true, data: undefined };
}

// ─── Drugs ────────────────────────────────────────────────

export async function createDrug(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.drug.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama obat sudah ada", field: "name" } };
  }

  const drug = await client.drug.create({ data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Drug",
    entityId: drug.id,
    changes: { name: { old: null, new: data.name }, unit: { old: null, new: data.unit }, pricePerUnit: { old: null, new: data.pricePerUnit } },
  });

  return { success: true, data: drug.id };
}

export async function updateDrug(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.drug.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Nama obat sudah ada", field: "name" } };
  }

  const currentDrug = await client.drug.findUnique({ where: { id } });
  if (!currentDrug) {
    return { success: false, error: { message: "Obat tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (currentDrug.unit !== data.unit) {
    return { success: false, error: { message: "Unit obat tidak dapat diubah setelah pembuatan", field: "unit" } };
  }

  await client.drug.update({ where: { id }, data: validated.data as any });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Drug",
    entityId: id,
    changes: {
      name: { old: currentDrug.name, new: data.name },
      pricePerUnit: { old: Number(currentDrug.pricePerUnit), new: data.pricePerUnit },
    },
  });

  return { success: true, data: id };
}

export async function archiveDrug(id: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const drug = await client.drug.findUnique({
    where: { id },
    include: {
      visitItems: { where: { visit: { status: { in: ["DRAFT", "COMPLETED"] } } }, take: 1 },
      prescriptionItems: { take: 1 },
    },
  });

  if (!drug) {
    return { success: false, error: { message: "Obat tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (drug.status === "ARCHIVED") {
    return { success: false, error: { message: "Obat sudah diarsipkan", code: "BUSINESS_RULE" } };
  }

  if (drug.visitItems.length > 0 || drug.prescriptionItems.length > 0) {
    return { success: false, error: { message: "Tidak bisa mengarsipkan obat yang sedang digunakan dalam kunjungan atau resep aktif", code: "BUSINESS_RULE" } };
  }

  await client.drug.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Drug",
    entityId: id,
    changes: { status: { old: "ACTIVE", new: "ARCHIVED" } },
  });

  return { success: true, data: undefined };
}

// ─── Products ─────────────────────────────────────────────

export async function createProduct(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.product.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama produk sudah ada", field: "name" } };
  }

  const product = await client.product.create({ data: validated.data });

  if (data.currentStock > 0) {
    await client.stockAdjustment.create({
      data: {
        productId: product.id,
        quantity: data.currentStock,
        reason: "INITIAL",
        notes: "Stok awal saat pembuatan produk",
        createdBy: session.user.id!,
      },
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Product",
    entityId: product.id,
    changes: { name: { old: null, new: data.name }, price: { old: null, new: data.price }, initialStock: { old: null, new: data.currentStock } },
  });

  return { success: true, data: product.id };
}

export async function updateProduct(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.product.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Nama produk sudah ada", field: "name" } };
  }

  const oldProduct = await client.product.findUnique({ where: { id } });
  if (!oldProduct) {
    return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  await client.product.update({ where: { id }, data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Product",
    entityId: id,
    changes: {
      name: { old: oldProduct.name, new: data.name },
      price: { old: Number(oldProduct.price), new: data.price },
      categoryId: { old: oldProduct.categoryId, new: data.categoryId },
    },
  });

  return { success: true, data: id };
}

export async function archiveProduct(id: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const product = await client.product.findUnique({ where: { id } });

  if (!product) {
    return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (product.status === "ARCHIVED") {
    return { success: false, error: { message: "Produk sudah diarsipkan", code: "BUSINESS_RULE" } };
  }

  if (product.currentStock > 0) {
    return { success: false, error: { message: `Tidak bisa mengarsipkan produk dengan stok ${product.currentStock}. Stok harus 0 terlebih dahulu.`, code: "BUSINESS_RULE" } };
  }

  await client.product.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "Product",
    entityId: id,
    changes: { status: { old: "ACTIVE", new: "ARCHIVED" } },
  });

  return { success: true, data: undefined };
}

// ─── Product Categories ───────────────────────────────────

export async function createProductCategory(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.productCategory.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama kategori sudah ada", field: "name" } };
  }

  const category = await client.productCategory.create({ data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ProductCategory",
    entityId: category.id,
    changes: { name: { old: null, new: data.name } },
  });

  return { success: true, data: category.id };
}

export async function updateProductCategory(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
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

  const existing = await client.productCategory.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) {
    return { success: false, error: { message: "Nama kategori sudah ada", field: "name" } };
  }

  const oldCategory = await client.productCategory.findUnique({ where: { id } });
  if (!oldCategory) {
    return { success: false, error: { message: "Kategori tidak ditemukan", code: "NOT_FOUND" } };
  }

  await client.productCategory.update({ where: { id }, data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "ProductCategory",
    entityId: id,
    changes: { name: { old: oldCategory.name, new: data.name } },
  });

  return { success: true, data: id };
}

export async function archiveProductCategory(id: string): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user || !MASTER_ROLES.includes((session.user as any).role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const category = await client.productCategory.findUnique({
    where: { id },
    include: { products: { where: { status: "ACTIVE" } } },
  });

  if (!category) {
    return { success: false, error: { message: "Kategori tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (category.status === "ARCHIVED") {
    return { success: false, error: { message: "Kategori sudah diarsipkan", code: "BUSINESS_RULE" } };
  }

  if (category.products.length > 0) {
    return { success: false, error: { message: `Tidak bisa mengarsipkan kategori dengan ${category.products.length} produk aktif. Arsipkan produk terlebih dahulu.`, code: "BUSINESS_RULE" } };
  }

  await client.productCategory.update({ where: { id }, data: { status: "ARCHIVED" } });

  await createAuditLog({
    userId: session.user.id,
    action: "ARCHIVE",
    entityType: "ProductCategory",
    entityId: id,
    changes: { status: { old: "ACTIVE", new: "ARCHIVED" } },
  });

  return { success: true, data: undefined };
}
