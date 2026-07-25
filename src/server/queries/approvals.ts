import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function getApprovals({
  page = 1,
  status,
  type,
}: {
  page?: number;
  status?: string;
  type?: string;
}) {
  const client = await prisma();
  const where: any = {};
  if (status) where.status = status;

  const results: any = {};

  if (!type || type === "service") {
    const serviceWhere = { ...where };
    const [data, total] = await Promise.all([
      client.serviceChangeRequest.findMany({
        where: serviceWhere,
        include: {
          service: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.serviceChangeRequest.count({ where: serviceWhere }),
    ]);
    results.serviceChanges = { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  if (!type || type === "drug") {
    const drugWhere = { ...where };
    const [data, total] = await Promise.all([
      client.drugChangeRequest.findMany({
        where: drugWhere,
        include: {
          drug: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.drugChangeRequest.count({ where: drugWhere }),
    ]);
    results.drugChanges = { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  if (!type || type === "product") {
    const productWhere = { ...where };
    const [data, total] = await Promise.all([
      client.productChangeRequest.findMany({
        where: productWhere,
        include: {
          product: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.productChangeRequest.count({ where: productWhere }),
    ]);
    results.productChanges = { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  if (!type || type === "stock") {
    const stockWhere = { ...where };
    const [data, total] = await Promise.all([
      client.stockAdjustmentApproval.findMany({
        where: stockWhere,
        include: {
          adjustment: { include: { product: { select: { id: true, name: true } } } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.stockAdjustmentApproval.count({ where: stockWhere }),
    ]);
    results.stockApprovals = { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  if (!type || type === "discount") {
    const discountWhere: any = { requiresApproval: true };
    if (status) discountWhere.approvalStatus = status;
    const [data, total] = await Promise.all([
      client.discountLog.findMany({
        where: discountWhere,
        include: {
          invoice: { select: { id: true, invoiceNumber: true } },
          applier: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { appliedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.discountLog.count({ where: discountWhere }),
    ]);
    results.discountLogs = { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  if (!type || type === "supplier") {
    const supplierWhere = { ...where };
    const [data, total] = await Promise.all([
      client.supplierChangeRequest.findMany({
        where: supplierWhere,
        include: {
          supplier: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      client.supplierChangeRequest.count({ where: supplierWhere }),
    ]);
    results.supplierChanges = { data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  return results;
}

export async function getApprovalById(id: string, type: string) {
  const client = await prisma();

  switch (type) {
    case "service":
      return client.serviceChangeRequest.findUnique({
        where: { id },
        include: {
          service: true,
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });
    case "drug":
      return client.drugChangeRequest.findUnique({
        where: { id },
        include: {
          drug: true,
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });
    case "product":
      return client.productChangeRequest.findUnique({
        where: { id },
        include: {
          product: true,
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });
    case "stock":
      return client.stockAdjustmentApproval.findUnique({
        where: { id },
        include: {
          adjustment: { include: { product: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });
    case "discount":
      return client.discountLog.findUnique({
        where: { id },
        include: {
          invoice: true,
          applier: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });
    case "supplier":
      return client.supplierChangeRequest.findUnique({
        where: { id },
        include: {
          supplier: true,
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });
    default:
      return null;
  }
}
