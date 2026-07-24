# PRD - Fitur Dashboard PetCare

> Dokumen ini dibuat berdasarkan analisis codebase nyata (`src/`, `prisma/`), bukan dokumentasi eksternal.

---

## 1. Ikhtisar Sistem

**PetCare** adalah aplikasi web manajemen klinik hewan yang dibangun dengan Next.js (App Router), Prisma ORM, PostgreSQL, dan NextAuth (JWT strategy). Sistem ini menyediakan dashboard terpisah untuk **5 role pengguna** dengan kontrol akses berbasis role dan middleware route protection.

### Arsitektur Dashboard

| Area | Path Prefix | Untuk Role |
|------|-------------|------------|
| Internal Dashboard | `/dashboard`, `/visits`, `/customers`, dll. | OWNER, DOKTER, KASIR, ADMIN |
| Customer Portal | `/portal/dashboard`, `/portal/pets`, dll. | CUSTOMER |
| Autentikasi | `/login`, `/forgot-password`, `/reset-password` | Publik |

---

## 2. Sistem Role & Permissions

### 2.1 Daftar Role

| Role | Keterangan | Seed User |
|------|------------|-----------|
| **OWNER** | Pemilik klinik, akses penuh ke seluruh fitur | `admin@klinik.com` |
| **DOKTER** | Dokter hewan, fokus pada kunjungan medis & billing | `dokter@klinik.com` |
| **KASIR** | Kasir, fokus pada POS, invoice, dan pembayaran | `kasir@klinik.com` |
| **ADMIN** | Administrator, fokus pada data master, stok, laporan | `admin1@klinik.com` |
| **CUSTOMER** | Pelanggan, akses portal self-service | `pelanggan@klinik.com` |

### 2.2 Permissions (dari `prisma/seed.ts`)

| Permission | OWNER | DOKTER | KASIR | ADMIN |
|------------|-------|--------|-------|-------|
| `view_dashboard` | ✅ | ✅ | ✅ | ✅ |
| `manage_master_data` | ✅ | ❌ | ❌ | ❌ |
| `manage_users` | ✅ | ❌ | ❌ | ✅ |
| `manage_settings` | ✅ | ❌ | ❌ | ❌ |
| `view_reports` | ✅ | ✅ | ✅ | ✅ |
| `manage_visits` | ✅ | ✅ | ❌ | ❌ |
| `manage_billing` | ✅ | ✅ | ❌ | ❌ |
| `manage_pos` | ✅ | ❌ | ✅ | ❌ |
| `manage_payments` | ✅ | ❌ | ✅ | ❌ |
| `manage_customers` | ✅ | ✅ | ✅ | ❌ |
| `manage_stock` | ✅ | ❌ | ❌ | ✅ |
| `view_audit_logs` | ✅ | ❌ | ❌ | ❌ |

### 2.3 Route Access Control (dari `src/middleware.ts`)

```typescript
const ROLE_PREFIXES: Record<string, string[]> = {
  OWNER: [],                          // Akses ke semua rute
  DOKTER: ["/visits", "/customers", "/billings", "/invoices", "/prescriptions"],
  KASIR: ["/pos", "/invoices", "/customers", "/billings"],
  ADMIN: ["/customers", "/visits", "/master/stock", "/reports"],
  CUSTOMER: ["/portal"],
};
```

Rute `/dashboard` dan `/notifications` dapat diakses oleh semua role internal (OWNER, DOKTER, KASIR, ADMIN).

---

## 3. Dashboard Per Role

---

### 3.1 Dashboard OWNER

**Path:** `/dashboard`  
**Sidebar Navigation (17 item):**

| # | Label | Path | Ikon |
|---|-------|------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | Pelanggan | `/customers` | Users |
| 3 | Kunjungan | `/visits` | Stethoscope |
| 4 | Billing | `/billings` | FileText |
| 5 | POS | `/pos` | ShoppingCart |
| 6 | Invoice | `/invoices` | Receipt |
| 7 | Resep | `/prescriptions` | FileText |
| 8 | Pembayaran | `/invoices?status=UNPAID` | CircleDollarSign |
| 9 | Laporan | `/reports` | BarChart3 |
| --- | *Divider* | --- | --- |
| 10 | Layanan | `/master/services` | Heart |
| 11 | Obat | `/master/drugs` | Pill |
| 12 | Produk | `/master/products` | Package |
| 13 | Stok | `/master/stock` | Warehouse |
| --- | *Divider* | --- | --- |
| 14 | Audit Log | `/audit-logs` | FileText |
| 15 | Pengguna | `/settings/users` | UserCog |
| 16 | Pengaturan | `/settings` | Settings |

**Fitur yang tersedia:**

- **Dashboard Utama** — Ringkasan statistik: kunjungan hari ini, pendapatan hari ini, pembayaran tertunda, stok menipis
- **Chart Kunjungan 7 Hari** — Visualisasi jumlah kunjungan per hari (7 hari terakhir)
- **Chart Pendapatan 30 Hari** — Visualisasi pendapatan per hari (30 hari terakhir)
- **Aksi Perlu Ditindak** — Daftar invoice belum dibayar, kunjungan belum selesai, produk stok rendah
- **Transaksi Terbaru** — 5 kunjungan terakhir
- **Pelanggan (CRUD)** — Daftar, cari, filter status, tambah, lihat detail, edit pelanggan beserta hewan peliharaannya
- **Kunjungan (CRUD)** — Daftar, cari, filter status & tanggal, tambah (dengan pencarian pelanggan, pemilihan hewan, input medis, pemilihan layanan/obat), edit, selesaikan kunjungan, cetak (PDF)
- **Billing (CRUD)** — Daftar, cari, filter status, buat billing baru (pilih pelanggan & hewan), lihat detail billing
- **POS (Point of Sale)** — Pencarian produk, filter per kategori, keranjang belanja (+/- qty), diskon, pajak, pemilihan metode pembayaran, kalkulasi kembalian, cetak struk
- **Invoice** — Daftar, cari, filter status & tanggal, lihat detail (item, pembayaran, status), cetak (PDF), proses pembayaran (partial/full)
- **Resep** — Daftar resep dari kunjungan, cetak resep (PDF)
- **Laporan** — 5 tab laporan: Harian, Pendapatan (per metode & per layanan), Inventaris (stok menipis), Pelanggan (top 10), Pembayaran (belum dibayar & per metode). Semua exportable ke CSV
- **Master Layanan (CRUD)** — Daftar, cari, filter kategori (8 kategori), tambah, edit, arsipkan
- **Master Obat (CRUD)** — Daftar, cari, tambah, edit, arsipkan. Unit: Tablet, Kapsula, Botol, Vial, Ampul, Gram, ml, Tetes, Lainnya
- **Master Produk (CRUD)** — Daftar, cari, filter kategori, tambah (dengan stok awal & reorder point), edit, arsipkan
- **Manajemen Stok** — Daftar stok produk, filter stok rendah, sesuaikan stok (tambah/kurangi dengan alasan), riwayat penyesuaian stok
- **Audit Log** — Daftar log aktivitas, filter per aksi (Create/Update/Delete/Archive/Payment/Status Change), per entity type (Customer/Visit/Billing/Invoice/Payment/Product/Drug/Service/User/PosOrder/StockAdjustment), per rentang tanggal
- **Manajemen Pengguna (CRUD)** — Daftar, cari, filter role, tambah pengguna (nama, email, telepon, role, password), edit, nonaktifkan/aktifkan, reset password (generates temporary password)
- **Pengaturan** — 4 tab: Info Perusahaan (nama, alamat, telepon, email, NPWP, footer invoice/struk), Konfigurasi Pajak (aktif/nonaktif, tipe flat/percentage, nilai), Metode Pembayaran (aktif/nonaktif per metode), Format Nomor (prefix untuk kunjungan, invoice, billing, struk, pembayaran, resep)

---

### 3.2 Dashboard DOKTER

**Path:** `/dashboard`  
**Sidebar Navigation (5 item):**

| # | Label | Path | Ikon |
|---|-------|------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | Pelanggan | `/customers` | Users |
| 3 | Kunjungan | `/visits` | Stethoscope |
| 4 | Billing | `/billings` | FileText |
| 5 | Resep | `/prescriptions` | FileText |

**Fitur yang tersedia:**

- **Dashboard Utama** — Sama dengan OWNER (statistik, chart, aksi perlu ditindak, transaksi terbaru)
- **Pelanggan** — Daftar, cari, filter status, lihat detail, edit
- **Kunjungan (CRUD)** — Daftar, cari, filter status & tanggal, tambah kunjungan baru (pilih pelanggan → pilih hewan → input data medis → pilih layanan → pilih obat dengan dosis/durasi/instruksi), edit kunjungan DRAFT, selesaikan kunjungan, cetak kunjungan (PDF), lihat detail kunjungan (info medis, layanan & obat, resep, invoice terkait)
- **Billing** — Daftar, cari, filter status, buat billing baru, lihat detail
- **Resep** — Daftar resep, cetak resep (PDF)

---

### 3.3 Dashboard KASIR

**Path:** `/dashboard`  
**Sidebar Navigation (7 item):**

| # | Label | Path | Ikon |
|---|-------|------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | Pelanggan | `/customers` | Users |
| 3 | Kunjungan | `/visits` | Stethoscope |
| 4 | Billing | `/billings` | FileText |
| 5 | POS | `/pos` | ShoppingCart |
| 6 | Invoice | `/invoices` | Receipt |
| 7 | Pembayaran | `/invoices?status=UNPAID` | CircleDollarSign |

**Fitur yang tersedia:**

- **Dashboard Utama** — Sama dengan OWNER
- **Pelanggan** — Daftar, cari, filter status, lihat detail, edit
- **Kunjungan** — Daftar, cari, filter status & tanggal, lihat detail (read-only)
- **Billing** — Daftar, cari, filter status, buat billing baru, lihat detail
- **POS (Point of Sale)** — Pencarian produk, filter per kategori, keranjang belanja (tambah/kurang/hapus item), diskon, pajak (dari settings), pemilihan metode pembayaran (Tunai/Transfer Bank/Kartu/e-Wallet/Lainnya), kalkulasi kembalian, cetak struk
- **Invoice** — Daftar, cari, filter status & tanggal, lihat detail, proses pembayaran, cetak (PDF)
- **Pembayaran** — Shortcut ke invoice dengan status UNPAID

---

### 3.4 Dashboard ADMIN

**Path:** `/dashboard`  
**Sidebar Navigation (5 item):**

| # | Label | Path | Ikon |
|---|-------|------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | Pelanggan | `/customers` | Users |
| 3 | Kunjungan | `/visits` | Stethoscope |
| 4 | Stok | `/master/stock` | Warehouse |
| 5 | Laporan | `/reports` | BarChart3 |

**Fitur yang tersedia:**

- **Dashboard Utama** — Sama dengan OWNER
- **Pelanggan** — Daftar, cari, filter status, lihat detail, edit
- **Kunjungan** — Daftar, cari, filter status & tanggal, lihat detail
- **Manajemen Stok** — Daftar stok produk, filter stok rendah, sesuaikan stok (tambah/kurangi), riwayat penyesuaian stok per produk
- **Laporan** — 5 tab laporan: Harian, Pendapatan, Inventaris, Pelanggan, Pembayaran. Semua exportable ke CSV

---

### 3.5 Portal CUSTOMER

**Path:** `/portal/dashboard`  
**Navigation (6 item, horizontal navbar):**

| # | Label | Path | Ikon |
|---|-------|------|------|
| 1 | Dashboard | `/portal/dashboard` | LayoutDashboard |
| 2 | Hewan Saya | `/portal/pets` | PawPrint |
| 3 | Riwayat | `/portal/visits` | Clock |
| 4 | Resep | `/portal/prescriptions` | FileText |
| 5 | Invoice | `/portal/invoices` | Receipt |
| 6 | Profil | `/portal/profile` | User |

**Fitur yang tersedia:**

- **Dashboard Portal** — Sapaan personal, daftar hewan peliharaan, 5 kunjungan terakhir dengan status, invoice belum dibayar
- **Hewan Saya (CRUD)** — Daftar hewan milik pelanggan, tambah hewan baru (nama, spesies, ras, tanggal lahir, berat, warna, catatan medis, gambar), edit hewan, lihat detail hewan
- **Riwayat Kunjungan** — Daftar kunjungan milik pelanggan, filter per hewan, per status, per rentang tanggal, lihat detail kunjungan (info medis, layanan & biaya)
- **Resep** — Daftar resep obat, lihat detail resep (nomor resep, tanggal, hewan, daftar obat dengan dosis), cetak resep (PDF)
- **Invoice** — Daftar invoice milik pelanggan, filter per status (UNPAID/PARTIAL/PAID), lihat detail invoice, cetak invoice (PDF)
- **Profil** — Edit informasi profil (nama, telepon, email, alamat), ubah password (password saat ini + password baru + konfirmasi)

---

## 4. Data Models

### 4.1 Core Entities (dari `prisma/schema.prisma`)

| Model | Keterangan | Key Fields |
|-------|------------|------------|
| **User** | Pengguna sistem | name, email, phone, password, roleId, status (ACTIVE/INACTIVE), failedLoginAttempts, lockedUntil |
| **Role** | Role pengguna | name (OWNER/DOKTER/KASIR/ADMIN/CUSTOMER), description |
| **Permission** | Permission akses | name, description |
| **RolePermission** | Mapping role-permission | roleId, permissionId |
| **Customer** | Data pelanggan | name, phone, email, address, city, postalCode, userId (link ke User), status |
| **Pet** | Hewan peliharaan | customerId, name, species, breed, birthDate, weightKg, colorMarking, medicalHistoryNotes, image, status |
| **Visit** | Kunjungan klinik | visitNumber, customerId, petId, visitDate, chiefComplaint, physicalExamNotes, diagnosis, treatmentNotes, weightKg, temperature, heartRate, status (DRAFT/COMPLETED/PAID), createdBy |
| **VisitItem** | Item dalam kunjungan | visitId, itemType (SERVICE/DRUG), serviceId, drugId, quantity, unitPrice, subtotal, dosage, durationDays, instructions |
| **Service** | Layanan klinik | name, description, category (KONSULTASI/VAKSINASI/GROOMING/OPERASI/LABORATORIUM/XRAY/RAWAT_INAP/LAINNYA), price, status |
| **Drug** | Obat | name, description, unit (TABLET/KAPSULA/BOTOL/VIAL/AMPUL/GRAM/ML/TETES/LAINNYA), pricePerUnit, status |
| **ProductCategory** | Kategori produk | name, description, status |
| **Product** | Produk | name, categoryId, price, description, image, barcode, currentStock, reorderPoint, status |
| **Billing** | Billing klinik | billingNumber, customerId, petId, billingStartDate, billingEndDate, status (OPEN/COMPLETED/PAID/SETTLED), notes, createdBy |
| **BillingItem** | Item dalam billing | billingId, itemType, serviceId, drugId, productId, quantity, unitPrice, subtotal, notes |
| **Invoice** | Invoice tagihan | invoiceNumber, customerId, petId, sourceType (VISIT/BILLING/POS), sourceId, invoiceDate, dueDate, subtotal, taxAmount, discountAmount, total, paidAmount, status (UNPAID/PARTIAL/PAID) |
| **InvoiceItem** | Item dalam invoice | invoiceId, itemName, quantity, unitPrice, subtotal, category |
| **Prescription** | Resep obat | prescriptionNumber, visitId, customerId, petId, prescriptionDate, status (ACTIVE/COMPLETED/CANCELLED) |
| **PrescriptionItem** | Item resep | prescriptionId, drugId, quantity, dosage, durationDays, instructions |
| **PosOrder** | Order POS | orderNumber, customerId, subtotal, taxAmount, discountAmount, total, paymentMethod, paymentAmount, changeAmount, status, createdBy |
| **PosOrderItem** | Item order POS | posOrderId, productId, quantity, unitPrice, subtotal |
| **Payment** | Pembayaran | paymentNumber, payableType, payableId, paymentMethod, amount, status (PENDING/PAID/FAILED), notes, receivedBy |
| **StockAdjustment** | Penyesuaian stok | productId, quantity, reason (INITIAL/POS_SOLD/BILLING_SOLD/DAMAGED/RETURN/OPNAME_ADJUST/OTHER), referenceId, createdBy, notes |
| **AuditLog** | Log aktivitas | userId, action (CREATE/UPDATE/DELETE/ARCHIVE/PAYMENT/STATUS_CHANGE), entityType, entityId, changes (JSON), ipAddress, userAgent |
| **Notification** | Notifikasi | userId, title, message, type, isRead, readAt |
| **Setting** | Pengaturan sistem | key (company_info/tax_config/payment_methods/numbering_format), value (JSON) |

### 4.2 Enums

| Enum | Nilai |
|------|-------|
| `UserStatus` | ACTIVE, INACTIVE |
| `CustomerStatus` | ACTIVE, INACTIVE |
| `PetStatus` | ACTIVE, ARCHIVED |
| `MasterStatus` | ACTIVE, ARCHIVED |
| `VisitStatus` | DRAFT, COMPLETED, PAID |
| `BillingStatus` | OPEN, COMPLETED, PAID, SETTLED |
| `InvoiceStatus` | UNPAID, PARTIAL, PAID |
| `PrescriptionStatus` | ACTIVE, COMPLETED, CANCELLED |
| `PaymentStatus` | PENDING, PAID, FAILED |
| `ServiceCategory` | KONSULTASI, VAKSINASI, GROOMING, OPERASI, LABORATORIUM, XRAY, RAWAT_INAP, LAINNYA |
| `DrugUnit` | TABLET, KAPSULA, BOTOL, VIAL, AMPUL, GRAM, ML, TETES, LAINNYA |
| `Itemtype` | SERVICE, DRUG, PRODUCT |
| `SourceType` | VISIT, BILLING, POS |
| `StockReason` | INITIAL, POS_SOLD, BILLING_SOLD, DAMAGED, RETURN, OPNAME_ADJUST, OTHER |
| `AuditAction` | CREATE, UPDATE, DELETE, ARCHIVE, PAYMENT, STATUS_CHANGE |

---

## 5. API Routes

| Path | Method | Fungsi |
|------|--------|--------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler (login, session, CSRF) |
| `/api/auth/reset-password` | POST | Reset password via token |
| `/api/notifications/[id]/read` | POST | Tandai notifikasi sebagai sudah dibaca |
| `/api/notifications/mark-all-read` | POST | Tandai semua notifikasi sebagai sudah dibaca |
| `/api/upload` | POST | Upload file (gambar produk, hewan, dll) |
| `/api/health` | GET | Health check endpoint |
| `/api/cron/cleanup` | GET | Cleanup job (cron) |

### Server Actions

| File | Fungsi |
|------|--------|
| `server/actions/auth.ts` | Login/logout |
| `server/actions/visits.ts` | CRUD kunjungan (create, update, complete) |
| `server/actions/billings.ts` | CRUD billing |
| `server/actions/invoices.ts` | CRUD invoice |
| `server/actions/payments.ts` | Proses pembayaran |
| `server/actions/pos.ts` | Proses transaksi POS |
| `server/actions/customers.ts` | CRUD pelanggan |
| `server/actions/pets.ts` | CRUD hewan |
| `server/actions/services.ts` | CRUD layanan, obat, produk (archive) |
| `server/actions/users.ts` | CRUD pengguna, reset password, change password |
| `server/actions/settings.ts` | Update pengaturan (company, tax, payment, numbering) |
| `server/actions/stock.ts` | Penyesuaian stok |
| `server/actions/prescriptions.ts` | Resep obat |
| `server/actions/notifications.ts` | Notifikasi |
| `server/actions/reports.ts` | Laporan |
| `server/actions/uploads.ts` | Upload file |
| `server/actions/queries.ts` | Query data untuk client components (fetch*) |

---

## 6. Fitur Lintas Sistem

### 6.1 Autentikasi & Keamanan
- **NextAuth Credentials Provider** — Login via email & password
- **JWT Strategy** — Session max 12 jam
- **Rate Limiting** — 10 request/15 menit untuk auth, 10 request/menit untuk upload, 100 request/menit untuk API
- **Account Lockout** — 5 percobaan login gagal → akun terkunci 30 menit
- **Password Hashing** — bcrypt (12 rounds)
- **Role-based Redirect** — Login → CUSTOMER ke `/portal/dashboard`, lainnya ke `/dashboard`

### 6.2 Navigasi & UI
- **Sidebar Collapsible** — Dashboard internal: sidebar bisa di-collapse/expand
- **Horizontal Navbar** — Portal customer: navigasi horizontal dengan mobile menu (Sheet)
- **Theme Toggle** — Dark/light mode tersedia di kedua dashboard
- **Notification Bell** — Bell notifikasi di navbar (internal & portal)
- **Responsive Design** — Grid responsif (1/2/3/4 kolom) untuk mobile hingga desktop
- **Loading States** — Skeleton loading untuk semua halaman
- **Empty States** — Placeholder kosong dengan ikon dan pesan untuk setiap daftar kosong
- **Status Badges** — Badge berwarna untuk setiap status (kunjungan, billing, invoice, dll)

### 6.3 Data Tables
- **Server-side Pagination** — 20 item per halaman
- **Search** — Pencarian teks untuk setiap daftar
- **Filter** — Filter per status, tanggal, kategori (tersedia di kunjungan, billing, invoice, audit log)
- **Column Actions** — Link ke detail, edit, aksi khusus per baris

### 6.4 Cetak/PDF
- **Kunjungan** — `/visits/[id]/print` (cetak detail kunjungan)
- **Invoice** — `/invoices/[id]/print` (cetak invoice)
- **Resep** — `/prescriptions/[id]/print` (cetak resep)
- **Struk POS** — Dialog struk dengan tombol cetak (window.print)

### 6.5 Caching
- **Dashboard Stats** — Cached 15 detik
- **Chart Data** — Cached 30 detik
- **Server-side Cache** — Fungsi `cached()` dari `server/lib/cache.ts`
