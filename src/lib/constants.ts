export const ROLES = {
  OWNER: "OWNER",
  DOKTER: "DOKTER",
  KASIR: "KASIR",
  CUSTOMER: "CUSTOMER",
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

export const APPOINTMENT_STATUSES = [
  { value: "PENDING", label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  { value: "CONFIRMED", label: "Dikonfirmasi", color: "bg-blue-100 text-blue-800" },
  { value: "COMPLETED", label: "Selesai", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Dibatalkan", color: "bg-red-100 text-red-800" },
  { value: "NO_SHOW", label: "Tidak Hadir", color: "bg-gray-100 text-gray-800" },
] as const;

export const PRESCRIPTION_STATUSES = [
  { value: "ACTIVE", label: "Aktif", color: "bg-blue-100 text-blue-800" },
  { value: "COMPLETED", label: "Selesai", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Dibatalkan", color: "bg-red-100 text-red-800" },
] as const;

export const HOTEL_BOOKING_STATUSES = [
  { value: "CONFIRMED", label: "Dikonfirmasi", color: "bg-blue-100 text-blue-800" },
  { value: "CHECKED_IN", label: "Check In", color: "bg-green-100 text-green-800" },
  { value: "CHECKED_OUT", label: "Check Out", color: "bg-gray-100 text-gray-800" },
  { value: "CANCELLED", label: "Dibatalkan", color: "bg-red-100 text-red-800" },
] as const;

export const HOTEL_ROOM_STATUSES = [
  { value: "AVAILABLE", label: "Tersedia", color: "bg-green-100 text-green-800" },
  { value: "OCCUPIED", label: "Terisi", color: "bg-red-100 text-red-800" },
  { value: "MAINTENANCE", label: "Maintenance", color: "bg-yellow-100 text-yellow-800" },
] as const;

export const STOCK_REASONS = [
  { value: "INITIAL", label: "Stok Awal" },
  { value: "POS_SOLD", label: "Terjual (POS)" },
  { value: "BILLING_SOLD", label: "Terjual (Billing)" },
  { value: "DAMAGED", label: "Rusak" },
  { value: "RETURN", label: "Retur" },
  { value: "OPNAME_ADJUST", label: "Penyesuaian Opname" },
  { value: "OTHER", label: "Lainnya" },
] as const;

export const APPROVAL_STATUSES = [
  { value: "PENDING", label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  { value: "APPROVED", label: "Disetujui", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Ditolak", color: "bg-red-100 text-red-800" },
] as const;

export const SUPPLIER_STATUSES = [
  { value: "ACTIVE", label: "Aktif", color: "bg-green-100 text-green-800" },
  { value: "INACTIVE", label: "Nonaktif", color: "bg-gray-100 text-gray-800" },
  { value: "BLACKLIST", label: "Blacklist", color: "bg-red-100 text-red-800" },
] as const;

export const PURCHASE_ORDER_STATUSES = [
  { value: "PENDING", label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  { value: "PARTIAL_RECEIVED", label: "Sebagian Diterima", color: "bg-blue-100 text-blue-800" },
  { value: "RECEIVED", label: "Diterima", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Dibatalkan", color: "bg-red-100 text-red-800" },
] as const;

export const RECONCILIATION_STATUSES = [
  { value: "PENDING", label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  { value: "APPROVED", label: "Disetujui", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Ditolak", color: "bg-red-100 text-red-800" },
] as const;

export const ITEM_TYPES = [
  { value: "SERVICE", label: "Layanan" },
  { value: "DRUG", label: "Obat" },
  { value: "PRODUCT", label: "Produk" },
] as const;

export const SOURCE_TYPES = [
  { value: "VISIT", label: "Kunjungan" },
  { value: "BILLING", label: "Billing" },
  { value: "POS", label: "POS" },
] as const;

export const PAGE_SIZE = 20;

export const NAV_ITEMS = {
  OWNER: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Persetujuan", href: "/owner/approvals", icon: "CheckCircle" },
    { label: "Master Data", href: "/master/services", icon: "Settings" },
    { label: "Pelanggan", href: "/customers", icon: "Users" },
    { label: "Laporan Keuangan", href: "/reports/financial", icon: "BarChart3" },
    { label: "Laporan Operasional", href: "/reports/operational", icon: "TrendingUp" },
    { label: "Rekonsiliasi", href: "/reconciliation", icon: "Wallet" },
    { label: "Audit Log", href: "/audit-logs", icon: "FileText" },
    { label: "Supplier", href: "/suppliers", icon: "Truck" },
    { type: "divider" },
    { label: "Pengguna", href: "/settings/users", icon: "UserCog" },
    { label: "Pengaturan", href: "/settings", icon: "Settings" },
  ],
  DOKTER: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Jadwal", href: "/appointments", icon: "Calendar" },
    { label: "Kunjungan", href: "/visits", icon: "Stethoscope" },
    { label: "Pasien", href: "/customers", icon: "Users" },
    { label: "Resep", href: "/prescriptions", icon: "FileText" },
  ],
  KASIR: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "POS", href: "/pos", icon: "ShoppingCart" },
    { label: "Invoice & Pembayaran", href: "/invoices", icon: "Receipt" },
    { label: "Piutang", href: "/invoices?status=UNPAID", icon: "CircleDollarSign" },
    { label: "Pelanggan", href: "/customers", icon: "Users" },
    { label: "Inventaris", href: "/master/stock", icon: "Warehouse" },
    { label: "Hotel", href: "/hotel", icon: "Building2" },
    { label: "Supplier", href: "/suppliers", icon: "Truck" },
    { label: "Rekonsiliasi Harian", href: "/reconciliation", icon: "CheckCircle" },
  ],
  CUSTOMER: [
    { label: "Dashboard", href: "/portal/dashboard", icon: "LayoutDashboard" },
    { label: "Hewan Saya", href: "/portal/pets", icon: "PawPrint" },
    { label: "Riwayat Kunjungan", href: "/portal/visits", icon: "Clock" },
    { label: "Janji Temu", href: "/portal/appointments", icon: "Calendar" },
    { label: "Resep", href: "/portal/prescriptions", icon: "FileText" },
    { label: "Invoice & Pembayaran", href: "/portal/invoices", icon: "Receipt" },
    { label: "Booking Hotel", href: "/portal/hotel-bookings", icon: "Building2" },
    { label: "Profil", href: "/portal/profile", icon: "User" },
  ],
} as const;
