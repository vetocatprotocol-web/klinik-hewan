"use server";

import prisma from "./prisma";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getCompanyInfo() {
  const setting = await prisma.setting.findUnique({ where: { key: "company_info" } });
  return (setting?.value as any) || {};
}

function basePrintStyles(): string {
  return `
    @page { margin: 15mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
    .clinic-info h1 { font-size: 18px; margin-bottom: 2px; }
    .clinic-info p { font-size: 11px; color: #666; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 22px; font-weight: bold; }
    .doc-title p { font-size: 11px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-box { background: #f9f9f9; padding: 10px; border-radius: 4px; }
    .info-box h3 { font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 4px; letter-spacing: 0.5px; }
    .info-box p { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; font-size: 11px; }
    th { background: #f0f0f0; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
    .totals .row.total { border-top: 2px solid #1a1a1a; padding-top: 6px; margin-top: 4px; font-weight: bold; font-size: 14px; }
    .totals .row.paid { color: #16a34a; }
    .totals .row.remaining { color: #dc2626; font-weight: bold; }
    .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 12px; }
    .footer p { font-size: 10px; color: #666; text-align: center; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
    .status-PAID { background: #dcfce7; color: #166534; }
    .status-PARTIAL { background: #fef9c3; color: #854d0e; }
    .status-UNPAID { background: #fecaca; color: #991b1b; }
    .status-ACTIVE { background: #dcfce7; color: #166534; }
    .status-COMPLETED { background: #e0e7ff; color: #3730a3; }
    .status-CANCELLED { background: #fecaca; color: #991b1b; }
    .payment-history { margin-top: 16px; }
    .payment-history h3 { font-size: 12px; margin-bottom: 8px; }
    .no-print { margin: 20px auto; text-align: center; }
    .no-print button { padding: 8px 24px; background: #1a1a1a; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
    @media print { .no-print { display: none; } }
  `;
}

export async function generateInvoiceHtml(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      pet: true,
      invoiceItems: true,
    },
  });

  if (!invoice) {
    return `<html><body><h1>Invoice tidak ditemukan</h1></body></html>`;
  }

  const payments = await prisma.payment.findMany({
    where: { payableType: "Invoice", payableId: invoice.id },
    orderBy: { createdAt: "desc" },
  });

  const companyInfo = await getCompanyInfo();
  const footer = companyInfo.invoiceFooter || "";
  const remaining = Number(invoice.total) - Number(invoice.paidAmount);

  const itemsHtml = invoice.invoiceItems
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.itemName)}</td>
      <td class="text-right">${item.quantity}</td>
      <td class="text-right">${formatCurrency(Number(item.unitPrice))}</td>
      <td class="text-right">${formatCurrency(Number(item.subtotal))}</td>
    </tr>`
    )
    .join("");

  const paymentsHtml =
    payments.length > 0
      ? `
    <div class="payment-history">
      <h3>Riwayat Pembayaran</h3>
      <table>
        <thead>
          <tr>
            <th>Nomor</th>
            <th>Metode</th>
            <th>Tanggal</th>
            <th class="text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${payments
            .map(
              (p) => `
            <tr>
              <td>${escapeHtml(p.paymentNumber)}</td>
              <td>${escapeHtml(p.paymentMethod)}</td>
              <td>${formatDateTime(p.createdAt)}</td>
              <td class="text-right">${formatCurrency(Number(p.amount))}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>${basePrintStyles()}</style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Cetak Invoice</button>
  </div>

  <div class="header">
    <div class="clinic-info">
      <h1>${escapeHtml(companyInfo.name || "Klinik Hewan")}</h1>
      <p>${escapeHtml(companyInfo.address || "")}</p>
      <p>${escapeHtml(companyInfo.phone || "")}</p>
      ${companyInfo.email ? `<p>${escapeHtml(companyInfo.email)}</p>` : ""}
    </div>
    <div class="doc-title">
      <h2>INVOICE</h2>
      <p>${escapeHtml(invoice.invoiceNumber)}</p>
      <p>${formatDate(invoice.invoiceDate)}</p>
      ${invoice.dueDate ? `<p>Jatuh tempo: ${formatDate(invoice.dueDate)}</p>` : ""}
      <p style="margin-top: 4px;"><span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Informasi Pelanggan</h3>
      <p><strong>${escapeHtml(invoice.customer.name)}</strong></p>
      <p>${escapeHtml(invoice.customer.phone)}</p>
      ${invoice.customer.email ? `<p>${escapeHtml(invoice.customer.email)}</p>` : ""}
      ${invoice.customer.address ? `<p>${escapeHtml(invoice.customer.address)}</p>` : ""}
    </div>
    <div class="info-box">
      <h3>Informasi Hewan</h3>
      ${invoice.pet ? `
        <p><strong>${escapeHtml(invoice.pet.name)}</strong></p>
        <p>${escapeHtml(invoice.pet.species)}${invoice.pet.breed ? ` - ${escapeHtml(invoice.pet.breed)}` : ""}</p>
        ${invoice.pet.weightKg ? `<p>Berat: ${invoice.pet.weightKg} kg</p>` : ""}
      ` : `<p style="color: #999;">Tidak ada data hewan</p>`}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Harga Satuan</th>
        <th class="text-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Subtotal</span>
      <span>${formatCurrency(Number(invoice.subtotal))}</span>
    </div>
    ${Number(invoice.taxAmount) > 0 ? `
    <div class="row">
      <span>Pajak</span>
      <span>${formatCurrency(Number(invoice.taxAmount))}</span>
    </div>` : ""}
    ${Number(invoice.discountAmount) > 0 ? `
    <div class="row">
      <span>Diskon</span>
      <span>-${formatCurrency(Number(invoice.discountAmount))}</span>
    </div>` : ""}
    <div class="row total">
      <span>Total</span>
      <span>${formatCurrency(Number(invoice.total))}</span>
    </div>
    ${Number(invoice.paidAmount) > 0 ? `
    <div class="row paid">
      <span>Sudah Dibayar</span>
      <span>${formatCurrency(Number(invoice.paidAmount))}</span>
    </div>` : ""}
    ${remaining > 0 ? `
    <div class="row remaining">
      <span>Sisa Tagihan</span>
      <span>${formatCurrency(remaining)}</span>
    </div>` : ""}
  </div>

  ${paymentsHtml}

  ${footer ? `
  <div class="footer">
    <p>${escapeHtml(footer)}</p>
  </div>` : ""}

  ${companyInfo.taxId ? `
  <div class="footer">
    <p>Tax ID: ${escapeHtml(companyInfo.taxId)}</p>
  </div>` : ""}
</body>
</html>`;
}

export async function generatePrescriptionHtml(prescriptionId: string): Promise<string> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      customer: true,
      pet: true,
      visit: true,
      prescriptionItems: {
        include: { drug: true },
      },
    },
  });

  if (!prescription) {
    return `<html><body><h1>Resep tidak ditemukan</h1></body></html>`;
  }

  const companyInfo = await getCompanyInfo();

  const drugsHtml = prescription.prescriptionItems
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.drug.name)}</td>
      <td class="text-right">${item.quantity}</td>
      <td>${escapeHtml(item.drug.unit)}</td>
      <td>${item.dosage ? escapeHtml(item.dosage) : "-"}</td>
      <td class="text-right">${item.durationDays ? `${item.durationDays} hari` : "-"}</td>
      <td>${item.instructions ? escapeHtml(item.instructions) : "-"}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resep ${escapeHtml(prescription.prescriptionNumber)}</title>
  <style>${basePrintStyles()}</style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Cetak Resep</button>
  </div>

  <div class="header">
    <div class="clinic-info">
      <h1>${escapeHtml(companyInfo.name || "Klinik Hewan")}</h1>
      <p>${escapeHtml(companyInfo.address || "")}</p>
      <p>${escapeHtml(companyInfo.phone || "")}</p>
      ${companyInfo.email ? `<p>${escapeHtml(companyInfo.email)}</p>` : ""}
    </div>
    <div class="doc-title">
      <h2>RESEP</h2>
      <p>${escapeHtml(prescription.prescriptionNumber)}</p>
      <p>${formatDate(prescription.prescriptionDate)}</p>
      <p style="margin-top: 4px;"><span class="status-badge status-${prescription.status}">${prescription.status}</span></p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Informasi Pelanggan</h3>
      <p><strong>${escapeHtml(prescription.customer.name)}</strong></p>
      <p>${escapeHtml(prescription.customer.phone)}</p>
      ${prescription.customer.email ? `<p>${escapeHtml(prescription.customer.email)}</p>` : ""}
    </div>
    <div class="info-box">
      <h3>Informasi Hewan</h3>
      ${prescription.pet ? `
        <p><strong>${escapeHtml(prescription.pet.name)}</strong></p>
        <p>${escapeHtml(prescription.pet.species)}${prescription.pet.breed ? ` - ${escapeHtml(prescription.pet.breed)}` : ""}</p>
        ${prescription.pet.weightKg ? `<p>Berat: ${prescription.pet.weightKg} kg</p>` : ""}
      ` : `<p style="color: #999;">Tidak ada data hewan</p>`}
    </div>
  </div>

  ${prescription.visit ? `
  <div class="info-box" style="margin-bottom: 16px;">
    <h3>Diagnosa</h3>
    <p>${escapeHtml(prescription.visit.diagnosis)}</p>
    ${prescription.visit.chiefComplaint ? `<p style="color: #666; font-size: 11px; margin-top: 4px;">Keluhan: ${escapeHtml(prescription.visit.chiefComplaint)}</p>` : ""}
  </div>` : ""}

  <table>
    <thead>
      <tr>
        <th>Obat</th>
        <th class="text-right">Jumlah</th>
        <th>Satuan</th>
        <th>Dosis</th>
        <th class="text-right">Durasi</th>
        <th>Instruksi</th>
      </tr>
    </thead>
    <tbody>
      ${drugsHtml}
    </tbody>
  </table>

  <div class="footer">
    <p>Dicetak pada: ${formatDateTime(new Date())}</p>
    <p style="margin-top: 4px;">${escapeHtml(companyInfo.name || "Klinik Hewan")}</p>
  </div>
</body>
</html>`;
}
