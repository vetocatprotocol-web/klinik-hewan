import { PrismaClient, ServiceCategory, DrugUnit } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Seed Roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "OWNER" },
      update: {},
      create: { name: "OWNER", description: "Pemilik klinik" },
    }),
    prisma.role.upsert({
      where: { name: "DOKTER" },
      update: {},
      create: { name: "DOKTER", description: "Dokter hewan" },
    }),
    prisma.role.upsert({
      where: { name: "KASIR" },
      update: {},
      create: { name: "KASIR", description: "Kasir" },
    }),
    prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", description: "Admin" },
    }),
    prisma.role.upsert({
      where: { name: "CUSTOMER" },
      update: {},
      create: { name: "CUSTOMER", description: "Pelanggan" },
    }),
  ]);

  const ownerRole = roles.find((r) => r.name === "OWNER")!;
  const dokterRole = roles.find((r) => r.name === "DOKTER")!;
  const kasirRole = roles.find((r) => r.name === "KASIR")!;
  const adminRole = roles.find((r) => r.name === "ADMIN")!;

  // Seed Permissions
  const permissions = [
    "view_dashboard",
    "manage_master_data",
    "manage_users",
    "manage_settings",
    "view_reports",
    "manage_visits",
    "manage_billing",
    "manage_pos",
    "manage_payments",
    "manage_customers",
    "manage_stock",
    "view_audit_logs",
  ];

  const permissionRecords = await Promise.all(
    permissions.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: name.replace(/_/g, " ") },
      })
    )
  );

  // Assign permissions to roles
  const allPermissions = permissionRecords.map((p) => p.id);

  // Owner gets all permissions
  for (const permId of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: permId } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: permId },
    });
  }

  // Dokter permissions
  const dokterPermissions = permissionRecords
    .filter((p) =>
      [
        "view_dashboard",
        "manage_visits",
        "manage_billing",
        "manage_customers",
        "view_reports",
      ].includes(p.name)
    )
    .map((p) => p.id);

  for (const permId of dokterPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: dokterRole.id, permissionId: permId } },
      update: {},
      create: { roleId: dokterRole.id, permissionId: permId },
    });
  }

  // Kasir permissions
  const kasirPermissions = permissionRecords
    .filter((p) =>
      [
        "view_dashboard",
        "manage_pos",
        "manage_payments",
        "manage_customers",
        "view_reports",
      ].includes(p.name)
    )
    .map((p) => p.id);

  for (const permId of kasirPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: kasirRole.id, permissionId: permId } },
      update: {},
      create: { roleId: kasirRole.id, permissionId: permId },
    });
  }

  // Admin permissions
  const adminPermissions = permissionRecords
    .filter((p) =>
      [
        "view_dashboard",
        "manage_users",
        "manage_stock",
        "view_reports",
      ].includes(p.name)
    )
    .map((p) => p.id);

  for (const permId of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }

  // Seed default owner user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@klinik.com" },
    update: {},
    create: {
      name: "Owner Klinik",
      email: "admin@klinik.com",
      phone: "08123456789",
      password: hashedPassword,
      roleId: ownerRole.id,
      status: "ACTIVE",
    },
  });

  // Seed default services
  const services = [
    { name: "Konsultasi Umum", category: "KONSULTASI" as ServiceCategory, price: 100000, description: "Konsultasi umum dengan dokter hewan" },
    { name: "Vaksinasi RABIES", category: "VAKSINASI" as ServiceCategory, price: 150000, description: "Vaksinasi rabies untuk anjing/kucing" },
    { name: "Vaksinasi F4", category: "VAKSINASI" as ServiceCategory, price: 200000, description: "Vaksinasi F4 untuk kucing" },
    { name: "Vaksinasi CPV", category: "VAKSINASI" as ServiceCategory, price: 180000, description: "Vaksinasi CPV untuk anjing" },
    { name: "Grooming Basic", category: "GROOMING" as ServiceCategory, price: 100000, description: "Grooming dasar (mandi, potong kuku, bersihkan telinga)" },
    { name: "Grooming Premium", category: "GROOMING" as ServiceCategory, price: 200000, description: "Grooming lengkap (mandi, potong bulu, styling)" },
    { name: "Sterilisasi Anjing", category: "OPERASI" as ServiceCategory, price: 1500000, description: "Operasi sterilisasi untuk anjing" },
    { name: "Sterilisasi Kucing", category: "OPERASI" as ServiceCategory, price: 1000000, description: "Operasi sterilisasi untuk kucing" },
    { name: "Pemeriksaan Lab Darah", category: "LABORATORIUM" as ServiceCategory, price: 250000, description: "Pemeriksaan darah lengkap" },
    { name: "Pemeriksaan Urine", category: "LABORATORIUM" as ServiceCategory, price: 150000, description: "Pemeriksaan urin" },
    { name: "X-Ray", category: "XRAY" as ServiceCategory, price: 300000, description: "Pemeriksaan X-Ray" },
    { name: "Rawat Inap (per hari)", category: "RAWAT_INAP" as ServiceCategory, price: 200000, description: "Rawat inap per hari" },
    { name: "Tambal Gigi", category: "LAINNYA" as ServiceCategory, price: 200000, description: "Tambal gigi hewan" },
    { name: "Cabut Gigi", category: "LAINNYA" as ServiceCategory, price: 300000, description: "Cabut gigi hewan" },
    { name: "Pembersihan Karang Gigi", category: "LAINNYA" as ServiceCategory, price: 250000, description: "Pembersihan karang gigi" },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  // Seed default drugs
  const drugs = [
    { name: "Amoxicillin 500mg", unit: "TABLET" as DrugUnit, pricePerUnit: 5000, description: "Antibiotik untuk infeksi bakteri" },
    { name: "Paracetamol 500mg", unit: "TABLET" as DrugUnit, pricePerUnit: 2000, description: "Obat penurun panas" },
    { name: "Ivermectin", unit: "ML" as DrugUnit, pricePerUnit: 15000, description: "Obat cacing dan parasit" },
    { name: "Meloxicam", unit: "ML" as DrugUnit, pricePerUnit: 20000, description: "Obat anti inflamasi" },
    { name: "Metronidazole", unit: "TABLET" as DrugUnit, pricePerUnit: 3000, description: "Antibiotik untuk infeksi usus" },
    { name: "Vitamin B Complex", unit: "ML" as DrugUnit, pricePerUnit: 10000, description: "Suplemen vitamin B" },
    { name: "Vitamin C", unit: "TABLET" as DrugUnit, pricePerUnit: 2000, description: "Suplemen vitamin C" },
    { name: "Ear Drops", unit: "TETES" as DrugUnit, pricePerUnit: 25000, description: "Obat tetes telinga" },
    { name: "Eye Drops", unit: "TETES" as DrugUnit, pricePerUnit: 20000, description: "Obat tetes mata" },
    { name: "Skin Cream", unit: "GRAM" as DrugUnit, pricePerUnit: 15000, description: "Krim untuk masalah kulit" },
    { name: "Deworming Tablet", unit: "TABLET" as DrugUnit, pricePerUnit: 8000, description: "Obat cacing tablet" },
    { name: "Antihistamine", unit: "TABLET" as DrugUnit, pricePerUnit: 5000, description: "Obat alergi" },
  ];

  for (const drug of drugs) {
    await prisma.drug.upsert({
      where: { name: drug.name },
      update: {},
      create: drug,
    });
  }

  // Seed default product categories
  const categories = [
    { name: "Makanan", description: "Makanan hewan peliharaan" },
    { name: "Vitamin & Suplemen", description: "Vitamin dan suplemen hewan" },
    { name: "Aksesoris", description: "Aksesoris hewan peliharaan" },
    { name: "Obat", description: "Obat-obatan hewan" },
    { name: "Kebersihan", description: "Produk kebersihan hewan" },
    { name: "Mainan", description: "Mainan hewan peliharaan" },
  ];

  const categoryRecords = [];
  for (const cat of categories) {
    const record = await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryRecords.push(record);
  }

  // Seed default products
  const foodCategory = categoryRecords.find((c) => c.name === "Makanan")!;
  const vitaminCategory = categoryRecords.find((c) => c.name === "Vitamin & Suplemen")!;
  const accCategory = categoryRecords.find((c) => c.name === "Aksesoris")!;

  const products = [
    { name: "Royal Canin Adult", categoryId: foodCategory.id, price: 250000, currentStock: 50, reorderPoint: 10, description: "Makanan anjing dewasa" },
    { name: "Pro Plan Indoor", categoryId: foodCategory.id, price: 180000, currentStock: 40, reorderPoint: 10, description: "Makanan kucing indoor" },
    { name: "Whiskas Junior", categoryId: foodCategory.id, price: 120000, currentStock: 60, reorderPoint: 15, description: "Makanan kucing anak" },
    { name: "Pedigree Adult", categoryId: foodCategory.id, price: 95000, currentStock: 35, reorderPoint: 10, description: "Makanan anjing dewasa" },
    { name: "Vitapet Multivitamin", categoryId: vitaminCategory.id, price: 75000, currentStock: 30, reorderPoint: 10, description: "Multivitamin untuk anjing/kucing" },
    { name: "Kalsyum Plus", categoryId: vitaminCategory.id, price: 45000, currentStock: 25, reorderPoint: 10, description: "Suplemen kalsium" },
    { name: "Collar Leather", categoryId: accCategory.id, price: 85000, currentStock: 20, reorderPoint: 5, description: "Kalung kulit untuk anjing" },
    { name: "Leash Nylon", categoryId: accCategory.id, price: 65000, currentStock: 25, reorderPoint: 5, description: "Tali kekang nylon" },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }

  // Seed default settings
  const defaultSettings = [
    {
      key: "company_info",
      value: {
        name: "Klinik Hewan PetCare",
        logo: "",
        address: "",
        phone: "",
        email: "",
        operatingHours: "Senin-Sabtu: 08.00-20.00, Minggu: 09.00-14.00",
        taxId: "",
        invoiceFooter: "Terima kasih atas kunjungan Anda",
        receiptFooter: "Terima kasih",
      },
    },
    {
      key: "tax_config",
      value: {
        type: "PERCENTAGE",
        value: 10,
        enabled: true,
      },
    },
    {
      key: "payment_methods",
      value: [
        { name: "Tunai", type: "CASH", active: true },
        { name: "Transfer Bank", type: "BANK_TRANSFER", active: true },
        { name: "Kartu Kredit", type: "CARD", active: true },
        { name: "Kartu Debit", type: "CARD", active: true },
      ],
    },
    {
      key: "numbering_format",
      value: {
        visitPrefix: "VIS",
        invoicePrefix: "INV",
        billingPrefix: "BIL",
        receiptPrefix: "RCP",
        paymentPrefix: "PAY",
        prescriptionPrefix: "RX",
      },
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
