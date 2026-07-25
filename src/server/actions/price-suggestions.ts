"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";

export async function suggestServicePriceChange(
  serviceId: string,
  newPrice: number,
  reason: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const service = await client.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return { success: false, error: { message: "Layanan tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (Number(service.price) === newPrice) {
    return { success: false, error: { message: "Harga baru sama dengan harga saat ini", code: "BUSINESS_RULE" } };
  }

  const request = await client.serviceChangeRequest.create({
    data: {
      serviceId,
      requestedBy: session.user.id!,
      oldPrice: service.price,
      newPrice,
      reason,
      status: "PENDING",
    },
  });

  const owners = await client.user.findMany({
    where: { role: "OWNER" as any },
    select: { id: true },
  });

  for (const owner of owners) {
    const { createNotification } = await import("../lib/notifications");
    await createNotification({
      userId: owner.id,
      title: "Saran Perubahan Harga Layanan",
      message: `${(session.user as any).name} mengusulkan perubahan harga ${service.name} dari Rp ${Number(service.price).toLocaleString("id-ID")} ke Rp ${newPrice.toLocaleString("id-ID")}.`,
      type: "info",
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ServiceChangeRequest",
    entityId: request.id,
    changes: {
      serviceName: { old: null, new: service.name },
      oldPrice: { old: null, new: Number(service.price) },
      newPrice: { old: null, new: newPrice },
    },
  });

  return { success: true, data: request.id };
}

export async function suggestDrugPriceChange(
  drugId: string,
  newPrice: number,
  reason: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const drug = await client.drug.findUnique({ where: { id: drugId } });
  if (!drug) {
    return { success: false, error: { message: "Obat tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (Number(drug.pricePerUnit) === newPrice) {
    return { success: false, error: { message: "Harga baru sama dengan harga saat ini", code: "BUSINESS_RULE" } };
  }

  const request = await client.drugChangeRequest.create({
    data: {
      drugId,
      requestedBy: session.user.id!,
      oldPrice: drug.pricePerUnit,
      newPrice,
      reason,
      status: "PENDING",
    },
  });

  const owners = await client.user.findMany({
    where: { role: "OWNER" as any },
    select: { id: true },
  });

  for (const owner of owners) {
    const { createNotification } = await import("../lib/notifications");
    await createNotification({
      userId: owner.id,
      title: "Saran Perubahan Harga Obat",
      message: `${(session.user as any).name} mengusulkan perubahan harga ${drug.name} dari Rp ${Number(drug.pricePerUnit).toLocaleString("id-ID")} ke Rp ${newPrice.toLocaleString("id-ID")}.`,
      type: "info",
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "DrugChangeRequest",
    entityId: request.id,
    changes: {
      drugName: { old: null, new: drug.name },
      oldPrice: { old: null, new: Number(drug.pricePerUnit) },
      newPrice: { old: null, new: newPrice },
    },
  });

  return { success: true, data: request.id };
}

export async function suggestProductPriceChange(
  productId: string,
  newPrice: number,
  reason: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["KASIR", "OWNER"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const product = await client.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (Number(product.price) === newPrice) {
    return { success: false, error: { message: "Harga baru sama dengan harga saat ini", code: "BUSINESS_RULE" } };
  }

  const request = await client.productChangeRequest.create({
    data: {
      productId,
      requestedBy: session.user.id!,
      oldPrice: product.price,
      newPrice,
      reason,
      status: "PENDING",
    },
  });

  const owners = await client.user.findMany({
    where: { role: "OWNER" as any },
    select: { id: true },
  });

  for (const owner of owners) {
    const { createNotification } = await import("../lib/notifications");
    await createNotification({
      userId: owner.id,
      title: "Saran Perubahan Harga Produk",
      message: `${(session.user as any).name} mengusulkan perubahan harga ${product.name} dari Rp ${Number(product.price).toLocaleString("id-ID")} ke Rp ${newPrice.toLocaleString("id-ID")}.`,
      type: "info",
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ProductChangeRequest",
    entityId: request.id,
    changes: {
      productName: { old: null, new: product.name },
      oldPrice: { old: null, new: Number(product.price) },
      newPrice: { old: null, new: newPrice },
    },
  });

  return { success: true, data: request.id };
}

export async function getPriceChangeRequests({
  status,
  entityType,
  page = 1,
  pageSize = 20,
}: {
  status?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const buildWhere = (model: string) => {
    const w: any = {};
    if (status) w.status = status;
    return w;
  };

  const models: Array<{ key: string; client: any; name: string }> = [];
  if (!entityType || entityType === "service") {
    models.push({ key: "serviceChanges", client: client.serviceChangeRequest, name: "service" });
  }
  if (!entityType || entityType === "drug") {
    models.push({ key: "drugChanges", client: client.drugChangeRequest, name: "drug" });
  }
  if (!entityType || entityType === "product") {
    models.push({ key: "productChanges", client: client.productChangeRequest, name: "product" });
  }

  const results: any = {};
  let totalCount = 0;

  for (const m of models) {
    const where = buildWhere(m.name);
    const [data, total] = await Promise.all([
      m.client.findMany({
        where,
        include: {
          ...(m.name === "service" && { service: { select: { name: true } } }),
          ...(m.name === "drug" && { drug: { select: { name: true } } }),
          ...(m.name === "product" && { product: { select: { name: true } } }),
          requester: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      m.client.count({ where }),
    ]);
    results[m.key] = data;
    totalCount += total;
  }

  return {
    success: true,
    data: {
      ...results,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export async function getPriceChangeHistory(
  entityType: string,
  entityId: string
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  let history: any[] = [];

  if (entityType === "service") {
    const service = await client.service.findUnique({ where: { id: entityId }, select: { id: true, name: true } });
    if (!service) {
      return { success: false, error: { message: "Layanan tidak ditemukan", code: "NOT_FOUND" } };
    }
    history = await client.serviceChangeRequest.findMany({
      where: { serviceId: entityId },
      include: { requester: { select: { id: true, name: true } }, approver: { select: { id: true, name: true } } },
      orderBy: { requestedAt: "desc" },
    });
  } else if (entityType === "drug") {
    const drug = await client.drug.findUnique({ where: { id: entityId }, select: { id: true, name: true } });
    if (!drug) {
      return { success: false, error: { message: "Obat tidak ditemukan", code: "NOT_FOUND" } };
    }
    history = await client.drugChangeRequest.findMany({
      where: { drugId: entityId },
      include: { requester: { select: { id: true, name: true } }, approver: { select: { id: true, name: true } } },
      orderBy: { requestedAt: "desc" },
    });
  } else if (entityType === "product") {
    const product = await client.product.findUnique({ where: { id: entityId }, select: { id: true, name: true } });
    if (!product) {
      return { success: false, error: { message: "Produk tidak ditemukan", code: "NOT_FOUND" } };
    }
    history = await client.productChangeRequest.findMany({
      where: { productId: entityId },
      include: { requester: { select: { id: true, name: true } }, approver: { select: { id: true, name: true } } },
      orderBy: { requestedAt: "desc" },
    });
  } else {
    return { success: false, error: { message: "Tipe entitas tidak valid", code: "BUSINESS_RULE" } };
  }

  return { success: true, data: history };
}

export async function getPriceChangeImpactAnalysis(
  changeRequestId: string
): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  let request: any = null;
  let entityType = "";
  let entityField = "";
  let itemName = "";

  const [serviceReq, drugReq, productReq] = await Promise.all([
    client.serviceChangeRequest.findUnique({
      where: { id: changeRequestId },
      include: { service: { select: { id: true, name: true } } },
    }),
    client.drugChangeRequest.findUnique({
      where: { id: changeRequestId },
      include: { drug: { select: { id: true, name: true } } },
    }),
    client.productChangeRequest.findUnique({
      where: { id: changeRequestId },
      include: { product: { select: { id: true, name: true } } },
    }),
  ]);

  if (serviceReq) {
    request = serviceReq;
    entityType = "service";
    entityField = "serviceId";
    itemName = serviceReq.service.name;
  } else if (drugReq) {
    request = drugReq;
    entityType = "drug";
    entityField = "drugId";
    itemName = drugReq.drug.name;
  } else if (productReq) {
    request = productReq;
    entityType = "product";
    entityField = "productId";
    itemName = productReq.product.name;
  } else {
    return { success: false, error: { message: "Permintaan perubahan tidak ditemukan", code: "NOT_FOUND" } };
  }

  const entityId = request[entityField];

  let affectedInvoices: any[] = [];

  if (entityType === "service") {
    affectedInvoices = await client.invoiceItem.findMany({
      where: {
        category: "SERVICE",
        invoice: { invoiceItems: { some: { category: "SERVICE" } } },
      },
      select: { invoiceId: true },
      distinct: ["invoiceId"],
    });

    const billingItems = await client.billingItem.findMany({
      where: { serviceId: entityId },
      select: { billingId: true },
      distinct: ["billingId"],
    });

    const visitItems = await client.visitItem.findMany({
      where: { serviceId: entityId },
      select: { visitId: true },
      distinct: ["visitId"],
    });

    return {
      success: true,
      data: {
        entityType,
        itemName,
        oldPrice: Number(request.oldPrice),
        newPrice: Number(request.newPrice),
        priceDifference: Number(request.newPrice) - Number(request.oldPrice),
        affectedBillingCount: billingItems.length,
        affectedVisitCount: visitItems.length,
        status: request.status,
      },
    };
  } else if (entityType === "drug") {
    const billingItems = await client.billingItem.findMany({
      where: { drugId: entityId },
      select: { billingId: true },
      distinct: ["billingId"],
    });

    const prescriptionItems = await client.prescriptionItem.findMany({
      where: { drugId: entityId },
      select: { prescriptionId: true },
      distinct: ["prescriptionId"],
    });

    return {
      success: true,
      data: {
        entityType,
        itemName,
        oldPrice: Number(request.oldPrice),
        newPrice: Number(request.newPrice),
        priceDifference: Number(request.newPrice) - Number(request.oldPrice),
        affectedBillingCount: billingItems.length,
        affectedPrescriptionCount: prescriptionItems.length,
        status: request.status,
      },
    };
  } else {
    const posItems = await client.posOrderItem.findMany({
      where: { productId: entityId },
      select: { posOrderId: true },
      distinct: ["posOrderId"],
    });

    const billingItems = await client.billingItem.findMany({
      where: { productId: entityId },
      select: { billingId: true },
      distinct: ["billingId"],
    });

    return {
      success: true,
      data: {
        entityType,
        itemName,
        oldPrice: Number(request.oldPrice),
        newPrice: Number(request.newPrice),
        priceDifference: Number(request.newPrice) - Number(request.oldPrice),
        affectedPosOrderCount: posItems.length,
        affectedBillingCount: billingItems.length,
        status: request.status,
      },
    };
  }
}
