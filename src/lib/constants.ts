export const ROLES = {
  OWNER: "OWNER",
  DOKTER: "DOKTER",
  KASIR: "KASIR",
  ADMIN: "ADMIN",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const SERVICE_CATEGORIES = [
  { value: "KONSULTASI", label: "Konsultasi" },
  { value: "VAKSINASI", label: "Vaksinasi" },
  { value: "GROOMING", label: "Grooming" },
  { value: "OPERASI", label: "Operasi" },
  { value: "LABORATORIUM", label: "Laboratorium" },
  { value: "XRAY", label: "X-Ray" },
  { value: "RAWAT_INAP", label: "Rawat Inap" },
  { value: "LAINNYA", label: "Lainnya" },
] as const;

export const DRUG_UNITS = [
  { value: "TABLET", label: "Tablet" },
  { value: "KAPSULA", label: "Kapsula" },
  { value: "BOTOL", label: "Botol" },
  { value: "VIAL", label: "Vial" },
  { value: "AMPUL", label: "Ampul" },
  { value: "GRAM", label: "Gram" },
  { value: "ML", label: "ml" },
  { value: "TETES", label: "Tetes" },
  { value: "LAINNYA", label: "Lainnya" },
] as const;

export const SPECIES = [
  { value: "Anjing", label: "Anjing" },
  { value: "Kucing", label: "Kucing" },
  { value: "Burung", label: "Burung" },
  { value: "Kelinci", label: "Kelinci" },
  { value: "Hamster", label: "Hamster" },
  { value: "Iguana", label: "Iguana" },
  { value: "Ular", label: "Ular" },
  { value: "Kura-kura", label: "Kura-kura" },
  { value: "Lainnya", label: "Lainnya" },
] as const;

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "BANK_TRANSFER", label: "Transfer Bank" },
  { value: "CARD", label: "Kartu" },
  { value: "EWALLET", label: "e-Wallet" },
  { value: "OTHER", label: "Lainnya" },
] as const;

export const VISIT_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "COMPLETED", label: "Selesai", color: "bg-blue-100 text-blue-800" },
  { value: "PAID", label: "Dibayar", color: "bg-green-100 text-green-800" },
] as const;

export const BILLING_STATUSES = [
  { value: "OPEN", label: "Terbuka", color: "bg-yellow-100 text-yellow-800" },
  { value: "COMPLETED", label: "Selesai", color: "bg-blue-100 text-blue-800" },
  { value: "PAID", label: "Dibayar", color: "bg-green-100 text-green-800" },
  { value: "SETTLED", label: "Lunas", color: "bg-green-100 text-green-800" },
] as const;

export const INVOICE_STATUSES = [
  { value: "UNPAID", label: "Belum Dibayar", color: "bg-red-100 text-red-800" },
  { value: "PARTIAL", label: "Sebagian", color: "bg-yellow-100 text-yellow-800" },
  { value: "PAID", label: "Dibayar", color: "bg-green-100 text-green-800" },
] as const;

export const PAGE_SIZE = 20;

export const NAV_ITEMS = {
  OWNER: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Pelanggan", href: "/customers", icon: "Users" },
    { label: "Kunjungan", href: "/visits", icon: "Stethoscope" },
    { label: "Billing", href: "/billings", icon: "FileText" },
    { label: "POS", href: "/pos", icon: "ShoppingCart" },
    { label: "Invoice", href: "/invoices", icon: "Receipt" },
    { label: "Resep", href: "/prescriptions", icon: "FileText" },
    { label: "Pembayaran", href: "/invoices?status=UNPAID", icon: "CircleDollarSign" },
    { label: "Laporan", href: "/reports", icon: "BarChart3" },
    { type: "divider" },
    { label: "Layanan", href: "/master/services", icon: "Heart" },
    { label: "Obat", href: "/master/drugs", icon: "Pill" },
    { label: "Produk", href: "/master/products", icon: "Package" },
    { label: "Stok", href: "/master/stock", icon: "Warehouse" },
    { type: "divider" },
    { label: "Audit Log", href: "/audit-logs", icon: "FileText" },
    { label: "Pengguna", href: "/settings/users", icon: "UserCog" },
    { label: "Pengaturan", href: "/settings", icon: "Settings" },
  ],
  DOKTER: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Pelanggan", href: "/customers", icon: "Users" },
    { label: "Kunjungan", href: "/visits", icon: "Stethoscope" },
    { label: "Billing", href: "/billings", icon: "FileText" },
    { label: "Resep", href: "/prescriptions", icon: "FileText" },
  ],
  KASIR: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Pelanggan", href: "/customers", icon: "Users" },
    { label: "Kunjungan", href: "/visits", icon: "Stethoscope" },
    { label: "Billing", href: "/billings", icon: "FileText" },
    { label: "POS", href: "/pos", icon: "ShoppingCart" },
    { label: "Invoice", href: "/invoices", icon: "Receipt" },
    { label: "Pembayaran", href: "/invoices?status=UNPAID", icon: "CircleDollarSign" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Pelanggan", href: "/customers", icon: "Users" },
    { label: "Kunjungan", href: "/visits", icon: "Stethoscope" },
    { label: "Stok", href: "/master/stock", icon: "Warehouse" },
    { label: "Laporan", href: "/reports", icon: "BarChart3" },
  ],
  CUSTOMER: [
    { label: "Dashboard", href: "/portal/dashboard", icon: "LayoutDashboard" },
    { label: "Hewan Saya", href: "/portal/pets", icon: "PawPrint" },
    { label: "Riwayat", href: "/portal/visits", icon: "Clock" },
    { label: "Invoice", href: "/portal/invoices", icon: "Receipt" },
    { label: "Resep", href: "/portal/prescriptions", icon: "FileText" },
    { label: "Profil", href: "/portal/profile", icon: "User" },
  ],
} as const;
