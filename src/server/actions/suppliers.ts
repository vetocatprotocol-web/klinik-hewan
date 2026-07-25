"use server";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ActionResult } from "@/types";
import { createAuditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";
import { generatePONumber, generateGRNumber } from "@/lib/utils";

function getUserId(session: any): string {
  const id = session.user?.id ?? (session.user as any)?.id;
  if (!id) throw new Error("UNAUTHORIZED");
  return id as string;
}

export async function createSupplier(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = getUserId(session);
  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postalCode: (formData.get("postalCode") as string) || undefined,
    contactPerson: (formData.get("contactPerson") as string) || undefined,
    paymentTerms: (formData.get("paymentTerms") as string) || undefined,
    specialization: (formData.get("specialization") as string) || undefined,
  };

  if (!data.name || data.name.trim() === "") {
    return { success: false, error: { message: "Nama supplier wajib diisi", field: "name" } };
  }

  const existing = await client.supplier.findFirst({ where: { name: data.name } });
  if (existing) {
    return { success: false, error: { message: "Nama supplier sudah ada", field: "name" } };
  }

  if (role === "KASIR") {
    const tempSupplier = await client.supplier.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        contactPerson: data.contactPerson,
        paymentTerms: data.paymentTerms,
        specialization: data.specialization,
        status: "ACTIVE",
        createdBy: userId,
      },
    });

    await client.supplierChangeRequest.create({
      data: {
        supplierId: tempSupplier.id,
        requestedBy: userId,
        changeType: "CREATE",
        oldData: undefined,
        newData: data as any,
        reason: "Pembuatan supplier baru oleh KASIR",
        status: "PENDING",
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entityType: "Supplier",
      entityId: tempSupplier.id,
      changes: { name: { old: null, new: data.name }, status: { old: null, new: "PENDING_APPROVAL" } },
    });

    return { success: true, data: tempSupplier.id };
  }

  const supplier = await client.supplier.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      contactPerson: data.contactPerson,
      paymentTerms: data.paymentTerms,
      specialization: data.specialization,
      status: "ACTIVE",
      verifiedBy: userId,
      verifiedAt: new Date(),
      createdBy: userId,
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    changes: { name: { old: null, new: data.name }, phone: { old: null, new: data.phone } },
  });

  return { success: true, data: supplier.id };
}

export async function updateSupplier(
  supplierId: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = getUserId(session);
  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa mengubah supplier", code: "FORBIDDEN" } };
  }

  const data = {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postalCode: (formData.get("postalCode") as string) || undefined,
    contactPerson: (formData.get("contactPerson") as string) || undefined,
    paymentTerms: (formData.get("paymentTerms") as string) || undefined,
    specialization: (formData.get("specialization") as string) || undefined,
  };

  if (!data.name || data.name.trim() === "") {
    return { success: false, error: { message: "Nama supplier wajib diisi", field: "name" } };
  }

  const supplier = await client.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    return { success: false, error: { message: "Supplier tidak ditemukan", code: "NOT_FOUND" } };
  }

  const nameExists = await client.supplier.findFirst({ where: { name: data.name, id: { not: supplierId } } });
  if (nameExists) {
    return { success: false, error: { message: "Nama supplier sudah ada", field: "name" } };
  }

  await client.supplier.update({
    where: { id: supplierId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      contactPerson: data.contactPerson,
      paymentTerms: data.paymentTerms,
      specialization: data.specialization,
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entityType: "Supplier",
    entityId: supplierId,
    changes: {
      name: { old: supplier.name, new: data.name },
      phone: { old: supplier.phone, new: data.phone },
      email: { old: supplier.email, new: data.email },
    },
  });

  return { success: true, data: supplierId };
}

export async function approveSupplier(
  supplierId: string,
  notes?: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = getUserId(session);
  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menyetujui supplier", code: "FORBIDDEN" } };
  }

  const changeRequest = await client.supplierChangeRequest.findFirst({
    where: { supplierId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (!changeRequest) {
    return { success: false, error: { message: "Tidak ada permintaan yang perlu disetujui", code: "NOT_FOUND" } };
  }

  await client.$transaction(async (tx) => {
    await tx.supplierChangeRequest.update({
      where: { id: changeRequest.id },
      data: {
        status: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
        reason: notes || changeRequest.reason,
      },
    });

    const newData = changeRequest.newData as any;
    if (changeRequest.changeType === "CREATE") {
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          name: newData.name,
          phone: newData.phone,
          email: newData.email,
          address: newData.address,
          city: newData.city,
          postalCode: newData.postalCode,
          contactPerson: newData.contactPerson,
          paymentTerms: newData.paymentTerms,
          specialization: newData.specialization,
          verifiedBy: userId,
          verifiedAt: new Date(),
        },
      });
    } else if (changeRequest.changeType === "UPDATE") {
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          name: newData.name,
          phone: newData.phone,
          email: newData.email,
          address: newData.address,
          city: newData.city,
          postalCode: newData.postalCode,
          contactPerson: newData.contactPerson,
          paymentTerms: newData.paymentTerms,
          specialization: newData.specialization,
        },
      });
    }
  });

  await createAuditLog({
    userId,
    action: "APPROVE",
    entityType: "SupplierChangeRequest",
    entityId: changeRequest.id,
    changes: {
      status: { old: "PENDING", new: "APPROVED" },
      changeType: { old: null, new: changeRequest.changeType },
    },
  });

  const requester = await client.user.findUnique({ where: { id: changeRequest.requestedBy } });
  if (requester) {
    await createNotification({
      userId: changeRequest.requestedBy,
      title: "Supplier Disetujui",
      message: `Permintaan supplier "${(changeRequest.newData as any).name}" telah disetujui oleh Owner.`,
      type: "success",
    });
  }

  return { success: true, data: undefined };
}

export async function rejectSupplier(
  supplierId: string,
  reason: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = getUserId(session);
  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menolak supplier", code: "FORBIDDEN" } };
  }

  if (!reason || reason.trim() === "") {
    return { success: false, error: { message: "Alasan penolakan wajib diisi", field: "reason" } };
  }

  const changeRequest = await client.supplierChangeRequest.findFirst({
    where: { supplierId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (!changeRequest) {
    return { success: false, error: { message: "Tidak ada permintaan yang perlu ditolak", code: "NOT_FOUND" } };
  }

  await client.supplierChangeRequest.update({
    where: { id: changeRequest.id },
    data: {
      status: "REJECTED",
      approvedBy: userId,
      approvedAt: new Date(),
      reason,
    },
  });

  await createAuditLog({
    userId,
    action: "REJECT",
    entityType: "SupplierChangeRequest",
    entityId: changeRequest.id,
    changes: {
      status: { old: "PENDING", new: "REJECTED" },
      reason: { old: null, new: reason },
    },
  });

  const requester = await client.user.findUnique({ where: { id: changeRequest.requestedBy } });
  if (requester) {
    await createNotification({
      userId: changeRequest.requestedBy,
      title: "Supplier Ditolak",
      message: `Permintaan supplier ditolak oleh Owner. Alasan: ${reason}`,
      type: "error",
    });
  }

  return { success: true, data: undefined };
}

export async function listSuppliers({
  search = "",
  status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const client = await prisma();
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    client.supplier.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    client.supplier.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getSupplierById(id: string) {
  const client = await prisma();
  return client.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          items: true,
        },
      },
      _count: { select: { purchaseOrders: true } },
    },
  });
}

export async function getSupplierPerformance(supplierId: string): Promise<ActionResult<any>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const supplier = await client.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    return { success: false, error: { message: "Supplier tidak ditemukan", code: "NOT_FOUND" } };
  }

  const purchaseOrders = await client.purchaseOrder.findMany({
    where: { supplierId },
    include: { items: true, receipts: true },
    orderBy: { createdAt: "desc" },
  });

  const totalPOCount = purchaseOrders.length;
  const deliveredPOs = purchaseOrders.filter((po) =>
    ["RECEIVED", "PARTIAL_RECEIVED"].includes(po.status)
  );
  const onTimePOs = deliveredPOs.filter((po) => {
    if (!po.requiredDate) return true;
    const lastReceipt = po.receipts.length > 0
      ? po.receipts.reduce((latest: any, r: any) => r.receivedDate > latest.receivedDate ? r : latest)
      : null;
    if (!lastReceipt) return true;
    return lastReceipt.receivedDate <= po.requiredDate;
  });
  const onTimeDeliveryRate = deliveredPOs.length > 0
    ? (onTimePOs.length / deliveredPOs.length) * 100
    : 0;

  const totalSpend = purchaseOrders.reduce(
    (sum, po) => sum + Number(po.totalAmount),
    0
  );

  const leadTimes = deliveredPOs
    .filter((po) => po.receipts.length > 0)
    .map((po) => {
      const lastReceipt = po.receipts.reduce((latest: any, r: any) =>
        r.receivedDate > latest.receivedDate ? r : latest
      );
      return lastReceipt.receivedDate.getTime() - po.orderDate.getTime();
    });
  const avgLeadTimeDays = leadTimes.length > 0
    ? leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length / (1000 * 60 * 60 * 24)
    : 0;

  return {
    success: true,
    data: {
      totalPOCount,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
      totalSpend,
      avgLeadTimeDays: Math.round(avgLeadTimeDays * 10) / 10,
    },
  };
}

export async function getCancelledPoHistory(): Promise<ActionResult<any[]>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const cancelledPOs = await client.purchaseOrder.findMany({
    where: { status: "CANCELLED" },
    include: {
      supplier: { select: { name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: cancelledPOs };
}

export async function createPurchaseOrder(
  supplierId: string,
  items: Array<{ productId?: string; drugId?: string; quantity: number; unitPrice: number }>,
  notes?: string
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = getUserId(session);
  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const supplier = await client.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    return { success: false, error: { message: "Supplier tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (supplier.status !== "ACTIVE") {
    return { success: false, error: { message: "Supplier tidak aktif", code: "BUSINESS_RULE" } };
  }

  if (!items || items.length === 0) {
    return { success: false, error: { message: "Minimal satu item harus ditambahkan", field: "items" } };
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      return { success: false, error: { message: "Jumlah item harus lebih dari 0", field: "items" } };
    }
    if (item.unitPrice < 0) {
      return { success: false, error: { message: "Harga satuan tidak boleh negatif", field: "items" } };
    }
    if (!item.productId && !item.drugId) {
      return { success: false, error: { message: "Setiap item harus memiliki produk atau obat", field: "items" } };
    }
  }

  const now = new Date();
  const poNumber = generatePONumber(now);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const po = await client.$transaction(async (tx) => {
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        orderDate: now,
        requiredDate: now,
        status: "PENDING",
        totalAmount,
        notes,
        createdBy: userId,
      },
    });

    for (const item of items) {
      await tx.purchaseOrderItem.create({
        data: {
          poId: purchaseOrder.id,
          productId: item.productId || null,
          drugId: item.drugId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });
    }

    return purchaseOrder;
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entityType: "PurchaseOrder",
    entityId: po.id,
    changes: {
      poNumber: { old: null, new: poNumber },
      supplierId: { old: null, new: supplierId },
      totalAmount: { old: null, new: totalAmount },
      itemCount: { old: null, new: items.length },
    },
  });

  return { success: true, data: po.id };
}

export async function receiveGoodsReceipt(
  poId: string,
  items: Array<{ poItemId: string; receivedQuantity: number }>
): Promise<ActionResult<string>> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = getUserId(session);
  const role = (session.user as any).role;
  if (!["OWNER", "KASIR"].includes(role)) {
    return { success: false, error: { message: "Akses ditolak", code: "FORBIDDEN" } };
  }

  const po = await client.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });

  if (!po) {
    return { success: false, error: { message: "Purchase Order tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (po.status === "CANCELLED") {
    return { success: false, error: { message: "Purchase Order sudah dibatalkan", code: "BUSINESS_RULE" } };
  }

  if (!items || items.length === 0) {
    return { success: false, error: { message: "Minimal satu item harus diterima", field: "items" } };
  }

  for (const item of items) {
    const poItem = po.items.find((i) => i.id === item.poItemId);
    if (!poItem) {
      return { success: false, error: { message: `Item PO dengan ID ${item.poItemId} tidak ditemukan`, field: "items" } };
    }
    if (item.receivedQuantity <= 0) {
      return { success: false, error: { message: "Jumlah yang diterima harus lebih dari 0", field: "items" } };
    }
    const remaining = poItem.quantity - poItem.receivedQuantity;
    if (item.receivedQuantity > remaining) {
      return { success: false, error: { message: `Jumlah diterima melebihi sisa (${remaining}) untuk item ini`, field: "items" } };
    }
  }

  const now = new Date();
  const grNumber = generateGRNumber(now);

  const receipt = await client.$transaction(async (tx) => {
    const goodsReceipt = await tx.goodsReceipt.create({
      data: {
        grNumber,
        poId,
        receivedDate: now,
        createdBy: userId,
      },
    });

    let allReceived = true;
    let anyReceived = false;

    for (const item of items) {
      const poItem = po.items.find((i) => i.id === item.poItemId)!;
      const newReceivedQty = poItem.receivedQuantity + item.receivedQuantity;

      await tx.purchaseOrderItem.update({
        where: { id: item.poItemId },
        data: {
          receivedQuantity: newReceivedQty,
          receivedAt: now,
        },
      });

      if (poItem.productId) {
        await tx.product.update({
          where: { id: poItem.productId },
          data: { currentStock: { increment: item.receivedQuantity } },
        });
      }

      anyReceived = true;
      if (newReceivedQty < poItem.quantity) {
        allReceived = false;
      }
    }

    const newStatus = allReceived ? "RECEIVED" : anyReceived ? "PARTIAL_RECEIVED" : po.status;
    await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus as any },
    });

    return goodsReceipt;
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entityType: "GoodsReceipt",
    entityId: receipt.id,
    changes: {
      grNumber: { old: null, new: grNumber },
      poId: { old: null, new: poId },
      poStatus: { old: po.status, new: receipt.id },
    },
  });

  return { success: true, data: receipt.id };
}

export async function approvePurchaseOrder(
  poId: string,
  notes?: string
): Promise<ActionResult> {
  const client = await prisma();
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Silakan login terlebih dahulu", code: "UNAUTHORIZED" } };
  }

  const userId = getUserId(session);
  const role = (session.user as any).role;
  if (role !== "OWNER") {
    return { success: false, error: { message: "Hanya Owner yang bisa menyetujui Purchase Order", code: "FORBIDDEN" } };
  }

  const po = await client.purchaseOrder.findUnique({
    where: { id: poId },
    include: { supplier: true, items: true },
  });

  if (!po) {
    return { success: false, error: { message: "Purchase Order tidak ditemukan", code: "NOT_FOUND" } };
  }

  if (po.status !== "PENDING") {
    return { success: false, error: { message: "Hanya PO dengan status PENDING yang bisa disetujui", code: "BUSINESS_RULE" } };
  }

  const THRESHOLD = Number(process.env.PO_APPROVAL_THRESHOLD || 0);
  if (THRESHOLD > 0 && Number(po.totalAmount) <= THRESHOLD) {
    return { success: false, error: { message: `PO dengan total di bawah Rp ${THRESHOLD.toLocaleString("id-ID")} tidak perlu persetujuan Owner`, code: "BUSINESS_RULE" } };
  }

  await client.purchaseOrder.update({
    where: { id: poId },
    data: { notes: notes || po.notes },
  });

  await createAuditLog({
    userId,
    action: "APPROVE",
    entityType: "PurchaseOrder",
    entityId: poId,
    changes: {
      poNumber: { old: po.poNumber, new: po.poNumber },
      status: { old: "PENDING", new: "APPROVED" },
      totalAmount: { old: null, new: Number(po.totalAmount) },
    },
  });

  try {
    const creator = await client.user.findUnique({ where: { id: po.createdBy } });
    if (creator) {
      await createNotification({
        userId: po.createdBy,
        title: "Purchase Order Disetujui",
        message: `PO ${po.poNumber} untuk ${po.supplier.name} telah disetujui oleh Owner.`,
        type: "success",
      });
    }
  } catch (error) {
    console.error("Failed to send PO approval notification:", error);
  }

  return { success: true, data: undefined };
}
