# HALAND PETCARE FULL - PRODUCT REQUIREMENTS DOCUMENT

**Version:** 1.0  
**Last Updated:** 2026-07-23  
**Status:** Active Development Specification  
**Document Type:** Single Source of Truth for Development

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [System Philosophy & Core Principles](#system-philosophy--core-principles)
3. [Scope & Non-Scope](#scope--non-scope)
4. [Functional Requirements](#functional-requirements)
5. [Technical Architecture](#technical-architecture)
6. [Database Specification](#database-specification)
7. [API Endpoints Specification](#api-endpoints-specification)
8. [Frontend Specifications](#frontend-specifications)
9. [Security Requirements](#security-requirements)
10. [Performance Requirements](#performance-requirements)
11. [Deployment & Configuration](#deployment--configuration)
12. [Third-Party Integrations](#third-party-integrations)
13. [Testing Requirements](#testing-requirements)
14. [Error Handling & Validation](#error-handling--validation)
15. [Constraints & Limitations](#constraints--limitations)

---

## EXECUTIVE SUMMARY

**Haland PetCare Full** adalah sistem operasional terintegrasi untuk klinik hewan yang dirancang dengan filosofi kesederhanaan, efisiensi, dan kemudahan penggunaan.

### Objektif Utama:
- ✅ Satu aplikasi, satu database, satu repository
- ✅ Zero complex configuration setup
- ✅ Separasi role & permission yang jelas
- ✅ Automasi billing & pricing
- ✅ Portal customer yang intuitif
- ✅ Minimal dependencies, maksimal stability

### Target Users:
- **Owner/Manager:** Dashboard kontrol penuh bisnis
- **Dokter:** Input medis dan tindakan
- **Kasir:** POS & payment processing
- **Customer:** Portal self-service tracking

---

## SYSTEM PHILOSOPHY & CORE PRINCIPLES

### 1. **Simplicity First**
- Setiap fitur harus memiliki tujuan operasional yang jelas
- Jangan ada dark features atau edge cases yang tidak terdokumentasi
- UI/UX harus intuitif tanpa training ekstensif

### 2. **Centralized Configuration**
- Semua rule bisnis dikelola Owner di dashboard admin
- Dokter & Kasir HANYA menjalankan proses operasional
- Zero permission untuk mengubah pricing/rules dari user biasa

### 3. **Integrated Workflow**
- Registrasi → Tindakan → Billing → Pembayaran dalam satu flow
- Data mengalir otomatis antar modul tanpa manual entry redundan
- Tidak ada duplikasi data atau sinkronisasi manual

### 4. **Minimal Stack**
- **Backend:** Laravel Full Stack (Blade, no SPA)
- **Frontend:** Laravel Blade + Alpine.js untuk interactivity ringan
- **Database:** PostgreSQL single instance
- **Caching:** Redis only if needed (not mandatory)
- **Queue:** Built-in database queue, no external broker mandatory

### 5. **Easy Deployment**
- Single .env file untuk semua konfigurasi
- Docker Compose optional (tidak wajib)
- Traditional deployment ke shared hosting or VPS supported
- Auto-migration on deployment
- Minimal external dependencies

---

## SCOPE & NON-SCOPE

### IN SCOPE v1.0:

#### Modul Operasional:
- ✅ Customer Management (registrasi, profil, data pet)
- ✅ Medical Records (simple visit notes, diagnosis, treatment)
- ✅ Service Management (tindakan, layanan dengan pricing fixed)
- ✅ Drug Management (obat dengan pricing fixed)
- ✅ Product Management (retail products dengan kategori & stock)
- ✅ Visit Processing (create visit, auto-generate invoice items)
- ✅ Billing Module (untuk perawatan bertahap: rawat inap, pet hotel)
- ✅ POS System (retail sales tanpa harus registrasi customer)
- ✅ Payment Processing (multiple payment methods, invoice settlement)
- ✅ Customer Portal (history, medical records, invoices, prescription view)
- ✅ Owner Dashboard (config master data, users, reports, analytics)
- ✅ Stock Management (product stock tracking & adjustment)
- ✅ Reporting (basic reports: daily sales, visits, inventory)

#### Backend Features:
- ✅ Role-based access control (Owner, Dokter, Kasir, Admin)
- ✅ Audit trail untuk transaksi penting
- ✅ Auto-numbering untuk invoice & receipt
- ✅ Tax calculation (flat or percentage)
- ✅ Discount management (manual per-transaction)
- ✅ Invoice generation & PDF export
- ✅ Email notifications (visit confirmation, invoice, prescription)
- ✅ Basic API untuk future mobile app

#### Frontend Features:
- ✅ Responsive design (mobile-friendly untuk customer portal)
- ✅ Real-time data validation
- ✅ Dashboard analytics dengan charts
- ✅ Search & filter functionality
- ✅ Print-friendly invoice & receipt
- ✅ Dark mode toggle (nice-to-have, tapi low priority)

### OUT OF SCOPE v1.0:

- ❌ Advanced medical imaging/DICOM
- ❌ Appointment scheduling system
- ❌ SMS/WhatsApp integration (email only)
- ❌ Multi-location/multi-branch support
- ❌ Advanced analytics/BI tools
- ❌ Veterinary prescription system terintegrasi dengan apotik
- ❌ Video consultation
- ❌ Supply chain management (PO to vendor)
- ❌ Insurance claim processing
- ❌ AI-powered diagnostics
- ❌ Real-time inventory sync dengan multiple warehouse
- ❌ Loyalty program/membership system

---

## FUNCTIONAL REQUIREMENTS

### FR-1: AUTHENTICATION & AUTHORIZATION

#### FR-1.1 Login System
**Requirement:**
- Email-based login (no username)
- Password hashing menggunakan bcrypt
- Password reset via email link
- Session-based authentication (Laravel Sanctum untuk API)
- Remember-me checkbox (optional)

**Business Rules:**
- Maximum 5 failed login attempts → account locked 30 menit
- Password harus minimal 8 karakter, kombinasi uppercase, lowercase, number
- Session timeout: 12 jam untuk inactivity
- Owner tidak bisa logout sendiri selama ada active transactions (warning popup)

#### FR-1.2 Role & Permission System
**4 Roles dengan permission fixed:**

| Role | Permissions | Notes |
|------|-------------|-------|
| **Owner** | Semua CRUD untuk master data, user management, config system, full report access | Minimal 1 per klinik |
| **Dokter** | Create/Read visit, input diagnosis, resep obat, lihat invoice. Tidak bisa edit harga atau buat service baru | Bisa multiple |
| **Kasir** | Read-only visit/medical, proses pembayaran, create POS order, lihat billing | Bisa multiple |
| **Admin** | User management assist, stock opname, report assist. Tidak bisa config bisnis | Optional |

**Technical Implementation:**
```php
// Permission harus di-seed ke database, tidak changeable via UI
Permissions::create(['name' => 'view_dashboard', 'role_id' => OWNER]);
Permissions::create(['name' => 'manage_master_data', 'role_id' => OWNER]);
// dll...
```

**Access Control:**
- Gate::define() untuk setiap critical action
- Middleware untuk protect routes
- Policy classes untuk model authorization

#### FR-1.3 Audit Trail
**Requirement:**
- Log setiap CREATE, UPDATE, DELETE pada master data (services, drugs, products)
- Log setiap transaksi (visit, payment, POS order)
- Log setiap perubahan permission/role user
- Simpan: user_id, action, table_name, old_value, new_value, timestamp

**Data Retention:**
- Keep 12 bulan (rolling), older data dapat di-archive

---

### FR-2: CUSTOMER MANAGEMENT

#### FR-2.1 Customer Registration & Auto-Account
**Scenario: Customer datang untuk layanan klinik**
1. Kasir/Dokter input data customer: nama, no HP, alamat, email (optional)
2. System auto-generate user account dengan password temp (dikirim via email atau SMS)
3. Customer dapat set password permanent di portal
4. Akun customer baru status = ACTIVE otomatis

**Requirement:**
- Field minimal: Nama, No HP (unique), Alamat, Email (optional tapi recommended)
- Duplicate check berdasarkan: exact match nama + no HP
- Auto-generate username berdasarkan email atau phone
- Email confirmation optional (tapi recommended)
- Customer tidak bisa self-register (register hanya dari klinik side)

#### FR-2.2 Customer Profile & Pet Management
**Customer dapat:**
- View/Edit profil: nama, alamat, no HP, email
- Add/Edit/Delete pet: nama, spesies, breed, age, berat, warna/marking, medical history
- View all pets dengan detail

**Pet Fields:**
- Nama, Jenis (select: anjing, kucing, burung, dll), Breed
- Tanggal lahir/perkiraan usia
- Berat badan (kg)
- Ciri khusus (warna, marking, identitas unik)
- Medical history notes (editable by owner)

**Business Rule:**
- Satu customer bisa punya multiple pets
- Pet tidak bisa dihapus (soft delete), hanya archived
- Medical history notes adalah info dari owner (bukan medical records formal)

---

### FR-3: MEDICAL RECORDS & VISIT MANAGEMENT

#### FR-3.1 Visit Creation & Medical Notes
**Workflow:**
1. Dokter create visit record untuk customer (cari/select customer & pet)
2. Input visit info: tanggal, jam, chief complaint (keluhan)
3. Input medical findings: diagnosis, physical exam notes
4. Input treatment: pilih tindakan dari master (multiple), pilih obat dari master (multiple dengan quantity)
5. Additional notes: catatan dokter apapun
6. Submit visit → auto-generate invoice items

**Visit Fields:**
- Visit ID (auto-number: VIS-YYYY-MMDD-XXXXX)
- Customer, Pet
- Visit date & time
- Chief complaint (text)
- Physical exam notes (text, optional)
- Diagnosis (text, boleh multiple)
- Vital signs (weight baru, suhu, heart rate - optional)
- Treatment notes (text)
- Status: DRAFT → COMPLETED → PAID

#### FR-3.2 Service & Drug Selection
**Dokter hanya bisa MEMILIH dari master:**
- Tindakan (service): dipilih checkbox, harga sudah fix dari master
- Obat: dipilih dropdown, quantity input, harga per unit sudah fix dari master

**Business Rule:**
- Dokter TIDAK BOLEH:
  - Ubah harga tindakan/obat
  - Buat tindakan/obat baru
  - Hapus tindakan/obat dari visit setelah di-submit (hanya Owner bisa)
- Dokter BISA:
  - Lihat history setiap pet
  - Export visit notes (PDF)
  - Lihat invoice yang sudah generated

#### FR-3.3 Simple Medical Records
**Requirement:**
- Rekam medis minimal & sederhana (fokus efisiensi, bukan formalitas medis)
- Per visit: keluhan, diagnosis, tindakan, obat, catatan
- NO lab values, NO detailed physical exam form
- NO template yang kompleks
- Dokter bisa lihat history 12 bulan belakangan

**Data Stored:**
```
visits
├── id
├── customer_id, pet_id
├── visit_date
├── chief_complaint
├── diagnosis
├── physical_exam_notes
├── treatment_notes
├── status (DRAFT, COMPLETED, PAID)
└── created_at, updated_at

visit_items
├── id
├── visit_id
├── item_type (SERVICE or DRUG)
├── service_id or drug_id
├── quantity
├── unit_price
└── subtotal (auto-calculated)
```

---

### FR-4: MASTER DATA MANAGEMENT (Owner Dashboard)

#### FR-4.1 Service Management
**Service = Tindakan/Layanan Medis**

**Owner dapat:**
- Create service baru: nama, deskripsi, harga, kategori
- Edit: nama, deskripsi, harga
- Soft-delete: archive (tidak hilang dari history, tapi tidak muncul di dropdown dokter)
- View: list dengan kategori, harga, usage count

**Service Fields:**
- ID (auto-increment)
- Nama service (unique, max 100 char)
- Deskripsi (optional)
- Kategori (select dari list: Konsultasi, Vaksin, Grooming, Operasi, dll)
- Harga (decimal, min 0)
- Status: ACTIVE, ARCHIVED
- Created at, Updated at

**Business Rule:**
- Service tidak bisa dihapus permanent (soft delete untuk audit)
- Perubahan harga akan berlaku untuk visit baru saja
- Owner bisa lihat: last used date, visit count, revenue

#### FR-4.2 Drug Management
**Drug = Obat**

**Owner dapat:**
- Create drug: nama, deskripsi, unit, harga
- Edit: nama, deskripsi, unit (tidak bisa ubah unit), harga
- View: list dengan harga, stok, usage frequency
- Soft-delete: archive

**Drug Fields:**
- ID (auto-increment)
- Nama drug (unique, max 100 char)
- Deskripsi (optional)
- Unit (select: tablet, kapsula, botol, vial, ampul, gram, ml, dll)
- Harga per unit (decimal)
- Status: ACTIVE, ARCHIVED
- Created at, Updated at

**Business Rule:**
- Perubahan harga berlaku untuk resep baru
- Unit tidak bisa diubah setelah created (untuk consistency)
- Drug bisa di-archive tapi tetap visible di history visit

#### FR-4.3 Product Management
**Product = Produk Retail (makanan, vitamin, aksesori, dll)**

**Owner dapat:**
- Create product: nama, kategori, harga, deskripsi, gambar (optional)
- Edit: nama, kategori, harga, deskripsi, gambar
- Manage kategori produk (create, edit, delete)
- Soft-delete product
- View: list dengan kategori, harga, stock, revenue

**Product Fields:**
- ID (auto-increment)
- Nama (unique, max 100 char)
- Kategori ID (select dari list)
- Harga (decimal)
- Deskripsi (optional, max 500 char)
- Gambar URL (optional)
- Status: ACTIVE, ARCHIVED
- Created at, Updated at

**Kategori Produk:**
- ID, Nama (unique), Deskripsi (optional)
- Soft-delete support

**Stock Management:**
- Setiap product punya field: current_stock (integer)
- Stock berkurang saat POS order di-submit
- Stock bisa di-adjust manual oleh Owner/Admin (stock opname)
- Low stock warning: jika stock < reorder_point, tampil warning di dashboard
- Reorder point bisa di-set per product

**Business Rule:**
- Kategori tidak boleh dihapus jika ada product aktif
- Stock tidak pernah minus (sistem reject jika POS order exceed stock)
- Stock opname: Owner bisa lihat adjustment history

#### FR-4.4 Tax & Discount Configuration
**Tax:**
- Tipe: Flat (fixed amount) atau Percentage (% dari subtotal)
- Applied to: All transactions atau specific categories
- Owner bisa enable/disable tax
- Tax value tampil terpisah di invoice

**Discount:**
- Bukan fixed configuration
- Discount applied per-transaction oleh Kasir saat POS/Billing checkout
- Tipe: Flat atau Percentage
- Maksimal discount % bisa di-limit oleh Owner (constraint)

#### FR-4.5 Payment Method Configuration
**Owner setup payment methods yang tersedia:**
- Cash
- Bank Transfer (bisa multiple bank accounts)
- Card (Credit/Debit)
- e-Wallet (Gopay, OVO, Dana - jika integrate payment gateway)
- Custom method (Owner bisa add custom nama)

**Per payment method:**
- Status: ACTIVE, INACTIVE
- Icon (optional)
- Instructions (optional, untuk user guidance)

**Business Rule:**
- Minimal 1 payment method harus ACTIVE (Cash)
- Perubahan setting tidak affect existing payments (immutable)

#### FR-4.6 Company Configuration
**Owner setup basic klinik info:**
- Nama klinik
- Logo (optional)
- Alamat
- No telepon
- Email
- Jam operasional (untuk reference saja, bukan untuk blocking access)
- Tax ID/NPWP (optional)
- Invoice footer notes (custom text)
- Receipt footer notes (custom text)

**Output Configuration:**
- Invoice prefix (contoh: INV-2026-)
- Invoice number format (auto or manual select)
- Receipt prefix (contoh: RCP-)
- Voucher/Claim number format

---

### FR-5: VISIT WORKFLOW & BILLING

#### FR-5.1 Service Visit Workflow
**Happy Path:**

```
1. VISIT CREATED (DRAFT)
   - Dokter input customer, pet, keluhan, diagnosis, tindakan, obat
   - Status = DRAFT

2. VISIT COMPLETED
   - Dokter klik "Complete Visit"
   - System auto-generate invoice items dari visit_items
   - Status = COMPLETED
   - Invoice dibuat dengan ID: INV-YYYY-MMDD-XXXXX
   - Invoice amount = sum(all service harga + all obat harga * qty) + tax - discount
   - Invoice status = UNPAID

3. PAYMENT
   - Kasir terima payment (POS module)
   - Payment amount >= Invoice amount
   - Jika payment penuh → Invoice status = PAID, Visit status = PAID
   - Jika partial payment → Balik ke UNPAID (support partial payment)
   - Change calculated otomatis

4. VISIT DONE
   - Customer dapat notification (email/SMS) dengan invoice & resep
```

**Business Rule:**
- Visit tidak bisa di-delete (hanya edit selama DRAFT)
- Setiap visit harus punya pet yang valid
- Diagnosis & treatment minimal ada 1
- Harga dari master data saat visit created (tidak dinamis)

#### FR-5.2 Billing Module (Perawatan Bertahap)
**Scenario: Rawat inap, pet hotel, atau treatment bertahap**

**Workflow:**

```
1. BILLING CREATED (OPEN)
   - Dokter/Kasir buat billing record untuk customer & pet
   - Billing ID: BIL-YYYY-MMDD-XXXXX
   - Status = OPEN
   - Billing date start = hari pembuatan

2. ADD ITEMS TO BILLING
   - Dokter add service (layanan harian, grooming, dll)
   - Dokter add drug (obat, nutrisi, dll)
   - Kasir add produk (makanan, vitamin, accessories)
   - Setiap item auto-calculate: unit_price * quantity
   - Items dapat di-add kapanpun selama status = OPEN

3. BILLING COMPLETED
   - Dokter/Owner klik "Complete" / "Discharge"
   - Status = OPEN → COMPLETED
   - Billing end date = hari discharge
   - Total calculated: sum semua items + tax - discount
   - Invoice auto-generated dengan final amount

4. PAYMENT
   - Kasir proses pembayaran (single payment untuk all items)
   - Payment >= invoice amount
   - Status = PAID, Billing status = SETTLED

5. BILLING CLOSED
   - System auto-close billing after payment settled
```

**Billing Item:**
```
billing_items
├── id
├── billing_id
├── item_type (SERVICE, DRUG, PRODUCT)
├── item_id (service_id, drug_id, or product_id)
├── quantity
├── unit_price (fixed saat item ditambah)
├── subtotal (qty * unit_price)
├── notes (optional, dokter add)
└── created_at
```

**Business Rule:**
- Billing status: OPEN → COMPLETED → PAID/SETTLED
- Items tidak bisa dihapus setelah COMPLETED (only Owner bisa edit jika diperlukan revisi)
- Billing dapat dipantau real-time: berapa hari, berapa items, berapa total
- Partial payment supported, tapi payment harus completed dalam 24 jam (configurable)

---

### FR-6: POS SYSTEM (Retail Sales)

#### FR-6.1 POS Workflow
**Requirement:**
- Customer NOT harus registrasi
- Kasir scan/select produk dari master
- Input quantity
- System calculate: subtotal, tax, total
- Multiple payment methods
- Print receipt

**POS Flow:**

```
1. NEW TRANSACTION
   - Kasir klik "New Sale"
   - No customer selection (optional, untuk loyalty tracking later)

2. ADD ITEMS
   - Kasir scan barcode atau cari produk
   - Input quantity
   - Item ditambah ke cart
   - Bisa add multiple items

3. REVIEW CART
   - Display: item name, qty, unit price, subtotal
   - Show subtotal, tax amount, total
   - Option untuk adjust qty atau remove item

4. APPLY DISCOUNT (Optional)
   - Discount tipe: Flat atau %
   - Calculate final total

5. PAYMENT
   - Select payment method
   - Input payment amount
   - System calculate change (jika cash)
   - Payment confirmed

6. RECEIPT
   - Auto-generate receipt ID: RCP-YYYY-MMDD-XXXXX
   - Print receipt atau email (jika customer email provided)
   - Transaction COMPLETED
```

**POS Order Data:**

```
pos_orders
├── id
├── order_number (RCP-YYYY-MMDD-XXXXX)
├── customer_id (nullable)
├── subtotal
├── tax_amount
├── discount_amount
├── total
├── payment_method
├── payment_amount
├── change
├── status (COMPLETED)
└── created_at

pos_order_items
├── id
├── pos_order_id
├── product_id
├── quantity
├── unit_price
└── subtotal
```

**Business Rule:**
- POS order tidak bisa di-edit setelah COMPLETED
- Stock harus available (sistem check sebelum submit)
- If payment < total → reject (no payment in arrears untuk POS)
- Change dihitung otomatis untuk cash payment

#### FR-6.2 POS Barcode/QR Support
**Optional but Recommended:**
- Product dapat di-scan via barcode
- Barcode field di master product
- Kasir dapat input barcode manually atau via scanner device
- If barcode not found → search by name fallback

---

### FR-7: PAYMENT & INVOICING

#### FR-7.1 Payment Processing
**Payment bisa dari:**
- Visit (layanan klinik)
- Billing (rawat inap, hotel)
- POS (retail sales)

**Payment Record:**

```
payments
├── id
├── payment_id (PAY-YYYY-MMDD-XXXXX)
├── payable_type (Visit, Billing, PosOrder)
├── payable_id
├── payment_method
├── amount
├── status (PENDING, PAID, FAILED)
├── notes (optional)
└── created_at
```

**Payment Flow:**
1. Kasir input: amount received
2. System check: amount >= invoice total
3. If match → mark PAID, invoice status → PAID
4. If partial → record payment, still UNPAID (flag for follow-up)
5. If more than total → calculate change
6. Generate payment receipt

**Business Rule:**
- Payment tidak bisa di-delete (only Owner bisa revert untuk extraordinary case)
- Multiple partial payments allowed (per payment recorded)
- Payment reconciliation auto-daily (summary export)

#### FR-7.2 Invoice Generation
**Invoice dibuat otomatis saat:**
- Visit di-COMPLETE
- Billing di-COMPLETE

**Invoice Data:**

```
invoices
├── id
├── invoice_number (INV-YYYY-MMDD-XXXXX)
├── customer_id
├── pet_id
├── source_type (Visit atau Billing)
├── source_id
├── invoice_date
├── due_date (optional)
├── subtotal
├── tax_amount
├── discount_amount
├── total
├── paid_amount
├── status (UNPAID, PARTIAL, PAID)
├── notes (optional)
└── created_at
```

**Invoice Item:**
```
invoice_items
├── id
├── invoice_id
├── item_name
├── quantity
├── unit_price
├── subtotal
└── category (Service, Drug, Product)
```

**Invoice Display:**
- Professional format dengan klinik header
- Item detail dengan harga satuan & subtotal
- Tax calculation transparent
- Payment status & remaining amount jelas
- Customer dapat download PDF

**Business Rule:**
- Invoice immutable after PAID (untuk audit)
- Invoice dapat di-download as PDF
- Invoice dapat di-email ke customer
- Invoice dapat di-reprint tanpa limit

#### FR-7.3 PDF Generation
**Requirement:**
- Invoice & Receipt harus di-generate as PDF
- Use Laravel library: barryvdh/laravel-dompdf atau mPDF
- Template professional dengan:
  - Klinik header (logo, nama, alamat, no telp)
  - Document type & number
  - Customer info & pet info (if applicable)
  - Item detail list
  - Total amount & payment status
  - Footer dengan tanggal & klinik notes

**Technical Implementation:**
```php
// Simple blade template untuk PDF
<x-invoice-template :invoice="$invoice" />

// Route untuk generate & download
Route::get('/invoices/{invoice}/download', [InvoiceController::class, 'download']);
```

---

### FR-8: CUSTOMER PORTAL

#### FR-8.1 Portal Access & Login
**Requirement:**
- Separate portal dari admin panel
- Customer login dengan email/username
- Dashboard personal untuk customer
- Session-based auth same dengan admin

**Portal URL:**
- Admin: /admin/dashboard
- Customer: /portal atau separate domain portal.klinik.com (simple redirect)

#### FR-8.2 Portal Features
**Customer dapat:**

1. **View My Pets**
   - List semua pet dengan info: nama, jenis, umur, berat
   - Sortir & filter
   - Lihat history visit per pet

2. **View Visit History**
   - Semua visit untuk semua pet
   - Filter by: pet, date range, status
   - Detail: tanggal, keluhan, diagnosis, tindakan, obat
   - Lihat nota pembayaran

3. **View Medical Records**
   - Per visit: keluhan, diagnosis, tindakan diberikan, obat diresepkan
   - View dalam format simple & readable
   - Export as PDF

4. **View Prescriptions**
   - Resep dari setiap visit
   - Detail: nama obat, dosis, jumlah, cara pakai, durasi
   - Prescription dapat di-export as PDF untuk dibawa ke apotek

5. **View Invoices & Payments**
   - Semua invoice (Visit dan Billing)
   - Status pembayaran (UNPAID, PARTIAL, PAID)
   - Detail item dan amount
   - Download invoice PDF
   - Payment history

6. **Profile Management**
   - Edit nama, alamat, no HP, email
   - Add/Edit pet (nama, jenis, umur, berat, catatan medis)
   - Change password
   - Delete account (soft delete, bisa restore)

7. **Notifications**
   - Email notifications untuk: visit selesai, invoice dibuat, payment confirmation
   - Simple in-app notifications (read/unread)

**Portal UI Requirements:**
- Mobile-responsive (primary access = mobile)
- Clean & simple design
- No heavy JS framework (use Alpine.js minimal)
- Fast load time (< 2s)
- Dark mode toggle

---

### FR-9: OWNER DASHBOARD

#### FR-9.1 Dashboard Overview
**Owner melihat:**
- Quick stats: today's visits, today's revenue, pending payments, low stock products
- Charts: visits trend (7 hari), revenue trend (30 hari)
- Pending actions: unpaid invoices, incomplete visits, low stock alerts
- Recent transactions: latest visits, latest payments

#### FR-9.2 Master Data Management
Owner dapat manage semuanya (CRUD) untuk:
- Services (tindakan)
- Drugs (obat)
- Products & Categories
- Stock & Reorder points
- Payment methods
- Company info & configuration

**Access:**
- Menu: Settings → Master Data
- Separate page untuk setiap entity
- Table view dengan pagination, search, filter
- Create/Edit dalam modal atau separate page

#### FR-9.3 User Management
**Owner dapat:**
- Create user baru: nama, email, role
- Edit user: nama, email, role, status
- Disable/Enable user (soft delete)
- Reset password user
- View user activity log (audit trail)

**User Fields:**
- ID, Nama, Email, Role, Status, Created at

#### FR-9.4 Reports & Analytics
**Reports Available:**

1. **Daily Report**
   - Date picker
   - Show: total visits, total revenue, visit breakdown by service, top selling product
   - Export as PDF/Excel

2. **Revenue Report**
   - Date range picker
   - Show: revenue by payment method, by service, by product
   - Growth comparison vs previous period
   - Export as PDF/Excel

3. **Inventory Report**
   - Product list dengan current stock & reorder point
   - Low stock alert
   - Stock movement (in/out)
   - Export as CSV

4. **Customer Report**
   - Customer activity: visit frequency, last visit, total spend
   - Top customers
   - Export as Excel

5. **Payment Report**
   - Unpaid invoices (aging)
   - Payment by method
   - Reconciliation report
   - Export as PDF

**Technical Implementation:**
- Gunakan Laravel Query Builder untuk complex reports
- Cache reports untuk 1 jam (refresh-able manually)
- Use Laravel Maatwebsite\Excel untuk export

#### FR-9.5 Settings & Configuration
**Owner dapat configure:**
- Company info (logo, nama, alamat, telepon)
- Tax setting (type, value)
- Invoice numbering format
- Receipt numbering format
- Payment methods
- Backup settings (backup database weekly)

---

### FR-10: NOTIFICATIONS & EMAIL

#### FR-10.1 Email Notifications
**Trigger events:**

| Event | Recipient | Content |
|-------|-----------|---------|
| Customer registered | Owner | New customer registered |
| Visit completed | Customer | Visit selesai, invoice created |
| Invoice generated | Customer | Invoice siap, link download |
| Payment received | Customer | Payment confirmed, receipt attached |
| Low stock | Owner | Product stock < reorder_point |
| Daily summary | Owner | Daily report summary |

**Email Template:**
- Simple & professional
- Plain text + HTML version
- Include: klinik logo, clear call-to-action, contact info

**Technical Implementation:**
- Use Laravel Mail
- Queue email untuk background processing (optional)
- Simple SMTP configuration via .env

#### FR-10.2 In-App Notifications
**Simple notification system:**
- Notification bell icon di top-right navbar
- Show: unread count
- Click → modal dengan list notifications
- Mark as read
- Auto-dismiss after 7 hari
- Clear history button

**Notification Scope:**
- Not critical (email is primary)
- For: visit alerts, pending payment reminders, inventory alerts

---

## TECHNICAL ARCHITECTURE

### Technology Stack

```
Frontend:
├── Laravel Blade (template engine)
├── Alpine.js (lightweight interactivity)
├── Tailwind CSS (styling)
├── HTMX (optional, untuk dynamic interactions)
└── Chart.js (untuk dashboard charts)

Backend:
├── Laravel 11 (framework)
├── PostgreSQL 14+ (database)
├── Redis (optional, untuk queue/cache)
└── Laravel Queue (database-based queue)

Deployment:
├── Docker Compose (optional, development)
├── Traditional VPS/Shared Hosting (primary)
├── Manual deployment via Git

External Services:
├── Email (SMTP via provider atau mailgun)
├── File Storage (local atau S3 optional)
└── Payment Gateway (optional, untuk future)
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER LAYER                            │
├─────────────┬──────────────────┬──────────────┬──────────┤
│   Owner     │   Dokter/Kasir   │  Customer    │   API    │
│   Panel     │   Panel          │  Portal      │  Mobile  │
└─────────────┴──────────────────┴──────────────┴──────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌─────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Laravel)                 │
├──────────────┬──────────────┬──────────────┬─────────────┤
│   Routes     │  Controllers │  Middleware  │   Requests  │
│   & Auth     │  & Services  │  & Policies  │  Validation │
└──────────────┴──────────────┴──────────────┴─────────────┘
                         │
                         │
┌─────────────────────────────────────────────────────────┐
│            BUSINESS LOGIC LAYER                          │
├──────────────┬──────────────┬──────────────┬─────────────┤
│  Services    │  Repositories│  Observers   │   Events    │
│              │              │ (Auto-action)│             │
└──────────────┴──────────────┴──────────────┴─────────────┘
                         │
                         │
┌─────────────────────────────────────────────────────────┐
│              DATA LAYER (Eloquent ORM)                   │
├──────────────┬──────────────┬──────────────┬─────────────┤
│   Models     │  Relations   │  Migrations  │  Factories  │
└──────────────┴──────────────┴──────────────┴─────────────┘
                         │
                         │
┌─────────────────────────────────────────────────────────┐
│         PERSISTENCE LAYER (PostgreSQL)                   │
├─────────────────────────────────────────────────────────┤
│                   SINGLE DATABASE                        │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
haland-petcare-full/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Owner/
│   │   │   │   ├── MasterDataController.php
│   │   │   │   ├── UserController.php
│   │   │   │   └── ReportController.php
│   │   │   ├── Dokter/
│   │   │   │   ├── VisitController.php
│   │   │   │   └── BillingController.php
│   │   │   ├── Kasir/
│   │   │   │   ├── POSController.php
│   │   │   │   └── PaymentController.php
│   │   │   ├── Customer/
│   │   │   │   └── PortalController.php
│   │   │   └── AuthController.php
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php
│   │   │   └── AuditLog.php
│   │   ├── Requests/
│   │   │   ├── StoreServiceRequest.php
│   │   │   ├── StorePetRequest.php
│   │   │   └── ... (validation requests)
│   │   └── Resources/
│   │       ├── InvoiceResource.php
│   │       └── ... (API responses)
│   ├── Models/
│   │   ├── User.php
│   │   ├── Customer.php
│   │   ├── Pet.php
│   │   ├── Visit.php
│   │   ├── VisitItem.php
│   │   ├── Billing.php
│   │   ├── BillingItem.php
│   │   ├── Service.php
│   │   ├── Drug.php
│   │   ├── Product.php
│   │   ├── PosOrder.php
│   │   ├── Invoice.php
│   │   ├── Payment.php
│   │   ├── AuditLog.php
│   │   └── ... (other models)
│   ├── Services/
│   │   ├── InvoiceService.php
│   │   ├── PaymentService.php
│   │   ├── ReportService.php
│   │   └── ... (business logic)
│   ├── Events/
│   │   ├── VisitCompleted.php
│   │   ├── PaymentProcessed.php
│   │   └── ... (domain events)
│   ├── Observers/
│   │   ├── VisitObserver.php
│   │   ├── BillingObserver.php
│   │   └── ... (auto-actions)
│   ├── Mail/
│   │   ├── VisitCompletedMail.php
│   │   ├── InvoiceGeneratedMail.php
│   │   └── ... (email templates)
│   ├── Notifications/
│   │   └── ... (in-app notifications)
│   ├── Policies/
│   │   ├── VisitPolicy.php
│   │   ├── MasterDataPolicy.php
│   │   └── ... (authorization)
│   └── Exceptions/
│       └── ... (custom exceptions)
├── database/
│   ├── migrations/
│   │   └── ... (all table structures)
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── PermissionSeeder.php
│   │   └── ... (initial data)
│   └── factories/
│       └── ... (for testing)
├── resources/
│   ├── views/
│   │   ├── layouts/
│   │   │   ├── app.blade.php
│   │   │   └── guest.blade.php
│   │   ├── admin/
│   │   │   ├── dashboard.blade.php
│   │   │   ├── master-data/
│   │   │   │   ├── services/
│   │   │   │   ├── drugs/
│   │   │   │   ├── products/
│   │   │   │   └── ...
│   │   │   ├── users/
│   │   │   └── reports/
│   │   ├── dokter/
│   │   │   ├── visits/
│   │   │   ├── billing/
│   │   │   └── ...
│   │   ├── kasir/
│   │   │   ├── pos/
│   │   │   ├── payment/
│   │   │   └── ...
│   │   ├── portal/
│   │   │   ├── dashboard.blade.php
│   │   │   ├── pets/
│   │   │   ├── visits/
│   │   │   ├── invoices/
│   │   │   └── ...
│   │   ├── emails/
│   │   │   ├── visit-completed.blade.php
│   │   │   ├── invoice-generated.blade.php
│   │   │   └── ...
│   │   └── components/
│   │       ├── navbar.blade.php
│   │       ├── sidebar.blade.php
│   │       └── ... (reusable components)
│   ├── css/
│   │   └── app.css (Tailwind)
│   └── js/
│       ├── app.js
│       └── alpine-components.js
├── routes/
│   ├── web.php
│   ├── api.php (for future mobile app)
│   ├── auth.php
│   └── ... (role-based routes)
├── config/
│   ├── app.php
│   ├── database.php
│   ├── queue.php
│   ├── mail.php
│   ├── auth.php
│   └── ... (minimal config)
├── tests/
│   ├── Feature/
│   └── Unit/
├── .env.example
├── docker-compose.yml (optional)
├── Dockerfile (optional)
├── docker/
│   └── nginx.conf (optional)
├── README.md
├── PRD.md (this document)
├── DEPLOYMENT.md
└── ...
```

### No Complex Configuration Philosophy

**What's NOT included:**
- ❌ No microservices
- ❌ No message brokers (RabbitMQ, Kafka)
- ❌ No complex caching layers
- ❌ No multiple databases or sharding
- ❌ No distributed tracing
- ❌ No complex container orchestration
- ❌ No API gateway patterns

**What IS included:**
- ✅ One .env file untuk semua setup
- ✅ Auto-migrations on deploy
- ✅ Simple queue via database
- ✅ Optional Redis (tapi bukan mandatory)
- ✅ Self-contained single app
- ✅ Traditional VPS deployment supported

---

## DATABASE SPECIFICATION

### Database Choice: PostgreSQL
**Why PostgreSQL?**
- Reliable, robust ACID compliance
- JSON support (flexibility for extensibility)
- Full-text search capability
- Great migration tools (Laravel migrations)
- Free & open source

### Database Schema - Complete

#### Core Tables

```sql
-- Users & Authentication
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Roles (seeded, tidak changeable)
CREATE TABLE roles (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- OWNER, DOKTER, KASIR, ADMIN
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Permissions (seeded, tidak changeable via UI)
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Role-Permission Pivot
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id),
    UNIQUE (role_id, permission_id)
);

-- Customers
CREATE TABLE customers (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    user_id BIGINT UNIQUE, -- Link ke user account (auto-created)
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Pets (owned by Customer)
CREATE TABLE pets (
    id BIGINT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100), -- Anjing, Kucing, Burung, dll
    breed VARCHAR(100),
    birth_date DATE,
    weight_kg DECIMAL(5,2),
    color_marking TEXT,
    medical_history_notes TEXT,
    status ENUM ('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Services (Tindakan medis)
CREATE TABLE services (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100), -- Konsultasi, Vaksin, Grooming, Operasi, dll
    price DECIMAL(12,2) NOT NULL,
    status ENUM ('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Drugs (Obat)
CREATE TABLE drugs (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    unit VARCHAR(50), -- tablet, kapsula, botol, vial, ampul, gram, ml, dll
    price_per_unit DECIMAL(12,2) NOT NULL,
    status ENUM ('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products (Retail)
CREATE TABLE products (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category_id BIGINT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    current_stock INT DEFAULT 0,
    reorder_point INT DEFAULT 10,
    status ENUM ('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- Product Categories
CREATE TABLE product_categories (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    status ENUM ('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stock Adjustments (untuk tracking stock movement)
CREATE TABLE stock_adjustments (
    id BIGINT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL, -- positive atau negative
    reason VARCHAR(100), -- INITIAL, POS_SOLD, DAMAGED, RETURN, OPNAME_ADJUST
    reference_id VARCHAR(50), -- pos_order_id atau manual adjust id
    created_by BIGINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Visits (Kunjungan klinik)
CREATE TABLE visits (
    id BIGINT PRIMARY KEY,
    visit_number VARCHAR(50) UNIQUE NOT NULL, -- VIS-YYYY-MMDD-XXXXX
    customer_id BIGINT NOT NULL,
    pet_id BIGINT NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME,
    chief_complaint TEXT,
    physical_exam_notes TEXT,
    diagnosis TEXT,
    treatment_notes TEXT,
    weight_kg DECIMAL(5,2),
    temperature DECIMAL(4,1),
    heart_rate INT,
    status ENUM ('DRAFT', 'COMPLETED', 'PAID') DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL, -- Dokter
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (pet_id) REFERENCES pets(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Visit Items (Services & Drugs dalam visit)
CREATE TABLE visit_items (
    id BIGINT PRIMARY KEY,
    visit_id BIGINT NOT NULL,
    item_type ENUM ('SERVICE', 'DRUG') NOT NULL,
    service_id BIGINT,
    drug_id BIGINT,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (drug_id) REFERENCES drugs(id)
);

-- Billings (Perawatan bertahap)
CREATE TABLE billings (
    id BIGINT PRIMARY KEY,
    billing_number VARCHAR(50) UNIQUE NOT NULL, -- BIL-YYYY-MMDD-XXXXX
    customer_id BIGINT NOT NULL,
    pet_id BIGINT NOT NULL,
    billing_start_date DATE NOT NULL,
    billing_end_date DATE,
    status ENUM ('OPEN', 'COMPLETED', 'PAID', 'SETTLED') DEFAULT 'OPEN',
    notes TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (pet_id) REFERENCES pets(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Billing Items
CREATE TABLE billing_items (
    id BIGINT PRIMARY KEY,
    billing_id BIGINT NOT NULL,
    item_type ENUM ('SERVICE', 'DRUG', 'PRODUCT') NOT NULL,
    service_id BIGINT,
    drug_id BIGINT,
    product_id BIGINT,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (drug_id) REFERENCES drugs(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Invoices (Generated from Visit atau Billing)
CREATE TABLE invoices (
    id BIGINT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV-YYYY-MMDD-XXXXX
    customer_id BIGINT NOT NULL,
    pet_id BIGINT,
    source_type ENUM ('VISIT', 'BILLING') NOT NULL,
    source_id BIGINT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status ENUM ('UNPAID', 'PARTIAL', 'PAID') DEFAULT 'UNPAID',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (pet_id) REFERENCES pets(id)
);

-- Invoice Items
CREATE TABLE invoice_items (
    id BIGINT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    category VARCHAR(50), -- SERVICE, DRUG, PRODUCT
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- POS Orders (Retail sales)
CREATE TABLE pos_orders (
    id BIGINT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- RCP-YYYY-MMDD-XXXXX
    customer_id BIGINT, -- Optional
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_amount DECIMAL(12,2) NOT NULL,
    change_amount DECIMAL(12,2) DEFAULT 0,
    status ENUM ('COMPLETED') DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- POS Order Items
CREATE TABLE pos_order_items (
    id BIGINT PRIMARY KEY,
    pos_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (pos_order_id) REFERENCES pos_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments
CREATE TABLE payments (
    id BIGINT PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL, -- PAY-YYYY-MMDD-XXXXX
    payable_type VARCHAR(50) NOT NULL, -- Visit, Billing, PosOrder
    payable_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM ('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
    notes TEXT,
    received_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50), -- CREATE, UPDATE, DELETE
    model_type VARCHAR(255),
    model_id BIGINT,
    changes JSONB, -- {old: {...}, new: {...}}
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settings (Company configuration)
CREATE TABLE settings (
    id BIGINT PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value LONGTEXT, -- JSON untuk complex values
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications (In-app)
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50), -- alert, info, success, warning
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Prescriptions (Generated from Visit)
CREATE TABLE prescriptions (
    id BIGINT PRIMARY KEY,
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    visit_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    pet_id BIGINT NOT NULL,
    prescription_date DATE NOT NULL,
    status ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (visit_id) REFERENCES visits(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (pet_id) REFERENCES pets(id)
);

-- Prescription Items
CREATE TABLE prescription_items (
    id BIGINT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    drug_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    dosage VARCHAR(255), -- e.g., "1 tablet, 2x daily"
    duration_days INT,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(id)
);
```

### Indexes for Performance

```sql
-- Frequently queried columns
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_pets_customer_id ON pets(customer_id);
CREATE INDEX idx_visits_customer_id ON visits(customer_id);
CREATE INDEX idx_visits_pet_id ON visits(pet_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_billings_customer_id ON billings(customer_id);
CREATE INDEX idx_billings_pet_id ON billings(pet_id);
CREATE INDEX idx_billings_status ON billings(status);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_pos_orders_created_at ON pos_orders(created_at);
CREATE INDEX idx_payments_payable_type_id ON payments(payable_type, payable_id);
CREATE INDEX idx_audit_logs_model_type_id ON audit_logs(model_type, model_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at);
```

---

## API ENDPOINTS SPECIFICATION

### Authentication Endpoints

```
POST   /api/auth/login
       Body: { email, password, remember_me }
       Response: { access_token, user }

POST   /api/auth/logout
       Response: { message }

POST   /api/auth/refresh
       Response: { access_token }

POST   /api/auth/forgot-password
       Body: { email }
       Response: { message }

POST   /api/auth/reset-password
       Body: { token, email, password, password_confirmation }
       Response: { message }
```

### Customer Endpoints

```
GET    /api/customers                    -- List semua customers
       Query: page, search, per_page
       Response: { data: [...], meta: {...} }

POST   /api/customers                    -- Create customer
       Body: { name, phone, email, address }
       Response: { id, ... }

GET    /api/customers/{id}               -- Get detail customer
       Response: { id, name, phone, ..., pets: [...] }

PUT    /api/customers/{id}               -- Update customer
       Body: { name, phone, email, address }
       Response: { ... }

DELETE /api/customers/{id}               -- Soft delete (archive)
       Response: { message }
```

### Pet Endpoints

```
GET    /api/customers/{customer_id}/pets           -- Get pets by customer
       Response: [ { id, name, species, breed, ... } ]

POST   /api/customers/{customer_id}/pets          -- Create pet
       Body: { name, species, breed, birth_date, weight_kg }
       Response: { ... }

GET    /api/pets/{id}                              -- Get pet detail + history
       Response: { id, ..., visits: [...], billings: [...] }

PUT    /api/pets/{id}                              -- Update pet
       Body: { name, species, breed, ... }
       Response: { ... }
```

### Visit Endpoints

```
GET    /api/visits                       -- List visits
       Query: page, pet_id, customer_id, status, date_from, date_to
       Response: { data: [...], meta: {...} }

POST   /api/visits                       -- Create visit (DRAFT)
       Body: { customer_id, pet_id, chief_complaint, ... }
       Response: { id, visit_number, status, ... }

GET    /api/visits/{id}                  -- Get visit + items
       Response: { id, ..., visit_items: [...] }

PUT    /api/visits/{id}                  -- Update visit (only if DRAFT)
       Body: { diagnosis, treatment_notes, ... }
       Response: { ... }

POST   /api/visits/{id}/items            -- Add service/drug to visit
       Body: { item_type, service_id|drug_id, quantity }
       Response: { ... }

DELETE /api/visits/{id}/items/{item_id}  -- Remove item (only if DRAFT)
       Response: { message }

PUT    /api/visits/{id}/complete         -- Complete visit → generate invoice
       Response: { status: COMPLETED, invoice_id }
```

### Billing Endpoints

```
GET    /api/billings                     -- List billings
       Query: page, status, customer_id, pet_id
       Response: { data: [...], meta: {...} }

POST   /api/billings                     -- Create billing (OPEN)
       Body: { customer_id, pet_id, notes }
       Response: { id, billing_number, status, ... }

GET    /api/billings/{id}                -- Get billing + items
       Response: { id, ..., billing_items: [...] }

POST   /api/billings/{id}/items          -- Add item to billing
       Body: { item_type, item_id, quantity, notes }
       Response: { ... }

DELETE /api/billings/{id}/items/{item_id} -- Remove item
       Response: { message }

PUT    /api/billings/{id}/complete       -- Complete billing → generate invoice
       Response: { status: COMPLETED, invoice_id }
```

### Master Data Endpoints (Owner Only)

```
GET    /api/admin/services               -- List services
       Query: page, search, status
       Response: { data: [...], meta: {...} }

POST   /api/admin/services               -- Create service
       Body: { name, description, category, price }
       Response: { ... }

PUT    /api/admin/services/{id}          -- Update service
       Body: { name, ..., price }
       Response: { ... }

DELETE /api/admin/services/{id}          -- Soft delete service
       Response: { message }

-- Similar endpoints untuk:
GET    /api/admin/drugs
POST   /api/admin/drugs
PUT    /api/admin/drugs/{id}
DELETE /api/admin/drugs/{id}

GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/{id}
DELETE /api/admin/products/{id}

GET    /api/admin/product-categories
POST   /api/admin/product-categories
PUT    /api/admin/product-categories/{id}
DELETE /api/admin/product-categories/{id}
```

### Invoice & Payment Endpoints

```
GET    /api/invoices                     -- List invoices
       Query: page, status, date_from, date_to, customer_id
       Response: { data: [...], meta: {...} }

GET    /api/invoices/{id}                -- Get invoice + items
       Response: { id, invoice_number, total, status, ..., items: [...] }

GET    /api/invoices/{id}/pdf            -- Download invoice as PDF
       Response: PDF file

POST   /api/invoices/{id}/email          -- Send invoice to customer
       Body: { email }
       Response: { message }

POST   /api/payments                     -- Process payment
       Body: { payable_type, payable_id, payment_method, amount }
       Response: { payment_id, status, change_amount }

GET    /api/payments/{id}                -- Get payment detail
       Response: { ... }
```

### POS Endpoints (Kasir)

```
POST   /api/pos/orders                   -- Create new POS order (start transaction)
       Body: { customer_id (optional) }
       Response: { pos_order_id, order_number }

POST   /api/pos/orders/{id}/items        -- Add product to POS order
       Body: { product_id, quantity }
       Response: { pos_order_id, items: [...], total: ... }

DELETE /api/pos/orders/{id}/items/{item_id} -- Remove item
       Response: { message }

POST   /api/pos/orders/{id}/checkout     -- Finalize & pay
       Body: { payment_method, payment_amount, discount_amount (optional) }
       Response: { order_id, receipt_number, status }

GET    /api/pos/orders/{id}/receipt      -- Download receipt
       Response: PDF file
```

### Report Endpoints (Owner)

```
GET    /api/admin/reports/daily          -- Daily report
       Query: date
       Response: { visits_count, revenue, breakdown: {...} }

GET    /api/admin/reports/revenue        -- Revenue report
       Query: date_from, date_to
       Response: { total_revenue, by_method, by_service, ... }

GET    /api/admin/reports/inventory      -- Inventory report
       Query: category_id (optional)
       Response: [ { product, stock, reorder_point, status } ]

GET    /api/admin/reports/customers      -- Customer report
       Response: [ { customer, visits_count, last_visit, total_spend } ]

GET    /api/admin/reports/payments       -- Payment report
       Query: date_from, date_to
       Response: { unpaid_invoices, by_method, reconciliation: {...} }

GET    /api/admin/reports/export/:type   -- Export report
       Query: format (pdf, excel, csv)
       Response: File download
```

### Configuration Endpoints (Owner)

```
GET    /api/admin/config                 -- Get all config
       Response: { company_info, tax_setting, payment_methods, ... }

PUT    /api/admin/config/company         -- Update company info
       Body: { name, logo_url, address, phone, email, ... }
       Response: { ... }

PUT    /api/admin/config/tax             -- Update tax setting
       Body: { type, value }
       Response: { ... }

PUT    /api/admin/config/payment-methods -- Update payment methods
       Body: [ { name, type, status, ... } ]
       Response: { ... }

PUT    /api/admin/config/numbering       -- Update numbering format
       Body: { invoice_prefix, receipt_prefix, ... }
       Response: { ... }
```

### User Management Endpoints (Owner)

```
GET    /api/admin/users                  -- List users
       Query: page, role, status
       Response: { data: [...], meta: {...} }

POST   /api/admin/users                  -- Create user
       Body: { name, email, phone, role_id }
       Response: { id, email, ... }

PUT    /api/admin/users/{id}             -- Update user
       Body: { name, email, phone, role_id, status }
       Response: { ... }

DELETE /api/admin/users/{id}             -- Soft delete user
       Response: { message }

POST   /api/admin/users/{id}/reset-password -- Reset password
       Body: {}
       Response: { temp_password }

GET    /api/admin/users/{id}/activity    -- Get user activity log
       Response: [ { action, timestamp, details } ]
```

### Stock Management Endpoints

```
GET    /api/admin/stock                  -- List product stock
       Query: page, product_id, status (normal, low)
       Response: { data: [...], meta: {...} }

POST   /api/admin/stock/adjust           -- Adjust stock (opname)
       Body: { product_id, quantity, reason, notes }
       Response: { product, new_stock, adjustment: {...} }

GET    /api/admin/stock/movements        -- Stock movement report
       Query: product_id, date_from, date_to
       Response: [ { product, movement, quantity, reason, timestamp } ]
```

### Portal Endpoints (Customer)

```
GET    /api/portal/dashboard             -- Customer dashboard
       Response: { pets, recent_visits, invoices, notifications }

GET    /api/portal/pets                  -- Get my pets
       Response: [ { id, name, species, ... } ]

GET    /api/portal/pets/{id}/visits      -- Get visits for pet
       Response: [ { visit_date, diagnosis, treatment, status } ]

GET    /api/portal/invoices              -- Get my invoices
       Response: [ { invoice_number, date, total, status, items } ]

GET    /api/portal/invoices/{id}/pdf     -- Download invoice PDF
       Response: PDF file

GET    /api/portal/prescriptions         -- Get my prescriptions
       Response: [ { prescription_number, date, drugs: [...] } ]

GET    /api/portal/prescriptions/{id}/pdf -- Download prescription PDF
       Response: PDF file

GET    /api/portal/profile               -- Get my profile
       Response: { id, name, phone, email, address, ... }

PUT    /api/portal/profile               -- Update profile
       Body: { name, phone, email, address }
       Response: { ... }

PUT    /api/portal/password              -- Change password
       Body: { current_password, password, password_confirmation }
       Response: { message }
```

---

## FRONTEND SPECIFICATIONS

### Technology Stack

```
Template Engine:     Laravel Blade
CSS Framework:       Tailwind CSS v3+
Interactive JS:      Alpine.js v3+
Charts:              Chart.js
Icons:               Heroicons
Form Validation:     Laravel Livewire or simple jQuery validation
PDF Rendering:       Browser native print-to-PDF
Mobile Support:      Responsive design (mobile-first approach)
```

### Design System

#### Color Palette
- Primary: #3B82F6 (Blue)
- Secondary: #10B981 (Green)
- Danger: #EF4444 (Red)
- Warning: #F59E0B (Amber)
- Info: #0EA5E9 (Cyan)
- Dark: #1F2937 (Gray-900)
- Light: #F9FAFB (Gray-50)

#### Typography
- Heading 1 (H1): 32px, Bold
- Heading 2 (H2): 24px, Bold
- Heading 3 (H3): 20px, Semi-bold
- Body: 16px, Regular
- Small: 14px, Regular
- Caption: 12px, Regular

#### Spacing
- Use Tailwind spacing scale: 4px units (gap-1, gap-2, gap-3, etc)

#### Components
- Navbar (fixed top, responsive hamburger menu)
- Sidebar (collapsible, role-based menu)
- Card (white background, shadow, rounded corners)
- Button (primary, secondary, danger variants)
- Form inputs (text, select, textarea, date, number)
- Modal/Dialog (centered, backdrop blur)
- Table (paginated, sortable, filterable)
- Toast notifications (top-right, auto-dismiss)
- Charts (responsive, animated)

### Responsive Breakpoints
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md, lg)
- Desktop: > 1024px (xl, 2xl)

### Page Layouts

#### Admin Panel Layout
```
┌────────────────────────────────────┐
│          TOP NAVBAR                │
│  [Logo] [Menu Hamburger] [Profile] │
└────────────────────────────────────┘
┌──────────────┬─────────────────────┐
│              │                     │
│  SIDEBAR     │   MAIN CONTENT      │
│  (Role Menu) │   (Page Content)    │
│              │                     │
│              │                     │
└──────────────┴─────────────────────┘
```

#### Customer Portal Layout
```
┌────────────────────────────────────┐
│          TOP NAVBAR                │
│  [Klinik Logo] [Notifications]     │
│                          [Profile] │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│          MAIN CONTENT              │
│   (Dashboard, Pets, Visits, etc)   │
│                                    │
└────────────────────────────────────┘
```

### Key UI Pages

#### 1. Owner Dashboard
**URL:** /admin/dashboard

```
┌─ Quick Stats Row ────────────────────┐
│ [Today Visits] [Today Revenue]       │
│ [Pending Pay]  [Low Stock Count]     │
└──────────────────────────────────────┘

┌─ Charts Section ─────────────────────┐
│ [Visits Trend - 7 days] [Revenue... -]│
│                        [30 days]     │
└──────────────────────────────────────┘

┌─ Pending Actions ────────────────────┐
│ [Unpaid Invoices] [Incomplete Visits]│
│ [Low Stock Products]                 │
└──────────────────────────────────────┘

┌─ Recent Transactions ────────────────┐
│ Table: Latest Visits, Payments, ...  │
└──────────────────────────────────────┘
```

**Key Metrics:**
- Total visits today
- Total revenue today
- Pending payments count
- Low stock alerts count

#### 2. Master Data Management (Services, Drugs, Products)
**URL:** /admin/services (example)

```
┌─ Toolbar ────────────────────────────┐
│ [Search Box] [Filter] [Create New]   │
└──────────────────────────────────────┘

┌─ Data Table ─────────────────────────┐
│ ID | Name | Category | Price | Actions│
│ .. | .... | ...      | ...   | E|D   │
│ [Pagination: 1 2 3 ... Next]         │
└──────────────────────────────────────┘
```

**Features:**
- Inline search/filter
- Sortable columns
- Pagination (20 items/page)
- Edit in modal
- Delete with confirmation

#### 3. Doctor's Visit Interface
**URL:** /dokter/visits/create

```
┌─ Customer Selection ─────────────────┐
│ Search Customer: [____________]      │
│ Selected: Budi - 0812345678          │
│ Select Pet: [Doggo ▼] (Anjing, 5yo) │
└──────────────────────────────────────┘

┌─ Visit Info ─────────────────────────┐
│ Chief Complaint: [____________]      │
│ Date: [2026-07-23] Time: [14:30]     │
│ Diagnosis: [____________]            │
│ Treatment Notes: [____________]      │
└──────────────────────────────────────┘

┌─ Services & Drugs Selection ─────────┐
│ Add Services: [Search...]            │
│ ✓ Vaksin RABIES - Rp 150.000         │
│ ✓ Konsultasi - Rp 100.000            │
│                                      │
│ Add Drugs: [Search...]               │
│ ✓ Amoxicillin (5 tablets) - Rp 50k   │
│                                      │
│ Subtotal: Rp 300.000                 │
└──────────────────────────────────────┘

┌─ Action Buttons ─────────────────────┐
│ [Save Draft] [Complete & Invoice]    │
└──────────────────────────────────────┘
```

#### 4. Kasir POS Interface
**URL:** /kasir/pos

```
┌─ POS Cart (Right Side) ──────────────┐
│ Current Transaction                  │
│                                      │
│ Item 1: Pro Plan x1  Rp 150.000     │
│ Item 2: Food x2      Rp 200.000     │
│                                      │
│ Subtotal:            Rp 350.000     │
│ Tax (10%):           Rp 35.000      │
│ Discount:            Rp 0           │
│ ─────────────────────────────────   │
│ TOTAL:               Rp 385.000     │
│                                      │
│ [Pay] [Clear]                        │
└──────────────────────────────────────┘

┌─ Product Catalog (Left Side) ────────┐
│ [Search/Scan Product]                │
│                                      │
│ ┌─ Category: Food ────────────────┐  │
│ │ [Royal Canin] Rp 250k     [+]   │  │
│ │ [Pro Plan]    Rp 150k     [+]   │  │
│ │ [Pedigree]    Rp 120k     [+]   │  │
│ └──────────────────────────────────┘  │
└──────────────────────────────────────┘
```

#### 5. Customer Portal Dashboard
**URL:** /portal/dashboard

```
┌─ Welcome Section ────────────────────┐
│ Halo, Budi! 👋                      │
│ Your Pets & Recent Activity          │
└──────────────────────────────────────┘

┌─ Pets Quick Access ──────────────────┐
│ [Pet1: Doggo] [Pet2: Kitty] [+]      │
│ (Clickable cards untuk navigate)     │
└──────────────────────────────────────┘

┌─ Recent Visits ──────────────────────┐
│ 23 Jul 2026 - Doggo - Vaksin RABIES │
│ Status: ✓ Paid                       │
│ [View Details]                       │
│                                      │
│ 20 Jul 2026 - Kitty - Konsultasi    │
│ Status: ⏳ Pending Payment           │
│ [View Details]                       │
└──────────────────────────────────────┘

┌─ Unpaid Invoices (if any) ───────────┐
│ [⚠️] Invoice INV-20260720-00123      │
│     Amount: Rp 250.000               │
│     Due: 25 Jul 2026                 │
│     [Pay Now]                        │
└──────────────────────────────────────┘
```

#### 6. Visit History Page
**URL:** /portal/visits

```
┌─ Filters ────────────────────────────┐
│ [Pet: All ▼] [Date From] [Date To]  │
│ [Status: All ▼]                      │
└──────────────────────────────────────┘

┌─ Visit List ─────────────────────────┐
│ Date: 23 Jul 2026, 14:30             │
│ Pet: Doggo (Anjing)                  │
│ Diagnosis: Vaksinasi tahunan         │
│ Tindakan: Vaksin RABIES              │
│ Resep: Amoxicillin 5 tablets         │
│ Status: ✓ Paid                       │
│ [View Details] [Download PDF]        │
│                                      │
│ Date: 20 Jul 2026, 10:00             │
│ ... (more visits)                    │
└──────────────────────────────────────┘
```

### Form Validation
- Real-time validation untuk required fields
- Show error message di bawah input
- Disable submit button jika form invalid
- Client-side + server-side validation mandatory

### Mobile Responsiveness
- Hamburger menu di mobile (< 640px)
- Sidebar becomes off-canvas drawer
- Tables become cards on mobile
- Full-width forms on mobile
- Touch-friendly buttons (min 44x44px)

### Accessibility
- Semantic HTML (headings, labels, form elements)
- ARIA labels untuk screen readers
- Keyboard navigation support (Tab, Enter)
- Color not only indicator (use icons/text too)
- Alt text untuk images

---

## SECURITY REQUIREMENTS

### FR-SEC-1: Authentication
- ✅ Bcrypt password hashing (default Laravel)
- ✅ Email verification (recommended tapi optional)
- ✅ Password reset via email token
- ✅ Session timeout: 12 jam inactivity
- ✅ CSRF protection (Laravel middleware default)

### FR-SEC-2: Authorization
- ✅ Role-based access control (RBAC)
- ✅ Model policies untuk resource authorization
- ✅ Gate::define() untuk critical actions
- ✅ Middleware CheckRole untuk route protection
- ✅ Audit trail untuk sensitive operations

### FR-SEC-3: Data Protection
- ✅ HTTPS mandatory di production
- ✅ SQL injection prevention (Eloquent ORM parameterized queries)
- ✅ XSS prevention (Blade auto-escape by default)
- ✅ CSRF token di setiap form (Laravel middleware)
- ✅ Password hashing untuk all user credentials
- ✅ Sensitive data tidak di-log (passwords, tokens)

### FR-SEC-4: API Security (if used)
- ✅ Sanctum token-based auth untuk API
- ✅ Rate limiting untuk API endpoints
- ✅ API token expiration (30 hari)
- ✅ CORS configuration yang strict

### FR-SEC-5: Audit & Compliance
- ✅ Audit trail untuk CREATE, UPDATE, DELETE operasi
- ✅ Audit trail untuk user login/logout
- ✅ Payment transaction logging lengkap
- ✅ Invoice immutable after PAID (no edit/delete)
- ✅ Encryption untuk sensitive config (.env)

### FR-SEC-6: Infrastructure Security
- ✅ Environment variables untuk sensitive data (.env file)
- ✅ Database user dengan minimal permissions
- ✅ Backup system dengan encryption
- ✅ Secure file upload (validate type & size)
- ✅ No sensitive data di version control

---

## PERFORMANCE REQUIREMENTS

### FR-PERF-1: Page Load Time
- **Target:** < 2 detik untuk initial page load (DCP)
- **Target:** < 1 detik untuk page navigation (cached assets)
- **Measurement:** Lighthouse score >= 80

### FR-PERF-2: Database Query Optimization
- ✅ Eager loading untuk relationships (N+1 query prevention)
- ✅ Database indexes di frequently queried columns
- ✅ Query caching untuk expensive reports
- ✅ Pagination mandatory untuk list views (20 items/page)

### FR-PERF-3: Frontend Performance
- ✅ Asset compression (gzip)
- ✅ CSS minification
- ✅ JS minification & bundling
- ✅ Image optimization (WebP format jika possible)
- ✅ Lazy loading untuk images
- ✅ CDN untuk static assets (optional)

### FR-PERF-4: Caching Strategy
- ✅ Browser caching (Cache-Control headers)
- ✅ Route caching di production
- ✅ Config caching di production
- ✅ Redis optional untuk session/query cache
- ✅ Fragment caching untuk heavy components

### FR-PERF-5: Scalability Considerations
- **Current Target:** Support 1000-2000 concurrent users
- ✅ Database connection pooling (optional dengan PgBouncer)
- ✅ Horizontal scaling ready (stateless sessions)
- ✅ No server-side state coupling
- ✅ Queue system scalable (switchable ke external broker)

---

## DEPLOYMENT & CONFIGURATION

### Environment Configuration

**Single .env file untuk semua setup:**

```
# App
APP_NAME="Haland PetCare"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://klinik.com

# Database
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=haland_petcare
DB_USERNAME=haland_user
DB_PASSWORD=secure_password

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=xxxx
MAIL_PASSWORD=xxxx
MAIL_FROM_ADDRESS=noreply@klinik.com
MAIL_FROM_NAME="Haland PetCare"

# Redis (optional)
REDIS_HOST=localhost
REDIS_PASSWORD=null
REDIS_PORT=6379

# Cache
CACHE_DRIVER=redis  # atau file
SESSION_DRIVER=database  # atau redis

# Queue
QUEUE_CONNECTION=database  # atau redis

# Payment Gateway (future)
PAYMENT_GATEWAY=
PAYMENT_API_KEY=

# Security
APP_KEY=base64:xxxxx (auto-generated by artisan key:generate)
SANCTUM_STATEFUL_DOMAINS=klinik.com,api.klinik.com
```

### Deployment Checklist

**Pre-deployment:**
- [ ] Clone repo
- [ ] Copy .env.example → .env
- [ ] Update .env dengan production credentials
- [ ] Run: `composer install --optimize-autoloader --no-dev`
- [ ] Run: `php artisan key:generate`
- [ ] Run: `php artisan migrate --force`
- [ ] Run: `php artisan db:seed --class=PermissionSeeder`
- [ ] Run: `php artisan config:cache`
- [ ] Run: `php artisan route:cache`
- [ ] Set permissions: storage/ & bootstrap/cache/ writable
- [ ] Setup web server (Nginx/Apache) dengan document_root=public/
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Setup log rotation (logrotate)
- [ ] Setup backup cronjob

**Post-deployment:**
- [ ] Test login: owner, dokter, kasir accounts
- [ ] Test customer portal access
- [ ] Test visit creation & invoice generation
- [ ] Test PDF generation (invoice & receipt)
- [ ] Test email notifications
- [ ] Check error logs
- [ ] Verify database backups running
- [ ] Monitor performance metrics

### Deployment Options

#### Option 1: Traditional VPS (Recommended)
```
OS: Ubuntu 20.04 LTS+
Server: Nginx
PHP: 8.2+
Database: PostgreSQL 14+
Process Manager: Supervisor
Cron: Laravel Scheduler (cronjob)
Backup: Automated daily to S3 or local
```

**Setup Script Sketch:**
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y nginx php8.2-fpm php8.2-pgsql postgresql-14

# Clone app
cd /var/www
git clone https://repo.git haland-petcare
cd haland-petcare

# Setup
composer install --optimize-autoloader --no-dev
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/haland-petcare
sudo ln -s /etc/nginx/sites-available/haland-petcare /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Permissions
sudo chown -R www-data:www-data storage bootstrap/cache
```

#### Option 2: Docker Compose (Development)
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=db
    depends_on:
      - db
      - redis
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: haland_petcare
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data
  redis:
    image: redis:7
volumes:
  db_data:
```

**Start Development:**
```bash
docker-compose up -d
docker-compose exec app php artisan migrate --seed
```

#### Option 3: Shared Hosting (Limited)
- Support PHP 8.2+ dengan PostgreSQL
- SSH access mandatory
- Cron job support
- Auto-deployment via Git webhook (optional)

### Backup Strategy

**Automated Daily Backup:**
```bash
# Cronjob (every 6 hours)
0 */6 * * * /var/www/haland-petcare/backup.sh

# backup.sh content
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump haland_petcare | gzip > $BACKUP_DIR/db_$DATE.sql.gz
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/haland-petcare

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
```

### Monitoring & Logging

**Log Files:**
- `/storage/logs/laravel.log` (application logs)
- System logs di `/var/log/nginx/` (web server)
- Database logs (slow query log optional)

**Monitoring Tools (Optional):**
- Sentry untuk error tracking
- NewRelic untuk performance monitoring
- Datadog untuk infrastructure monitoring

**Minimum Alerts:**
- Error rate > 1%
- Response time > 5s
- Database connection pool exhausted
- Disk space < 10%
- Memory usage > 80%

---

## THIRD-PARTY INTEGRATIONS

### FR-INT-1: Email Service
**Requirement:** Simple SMTP email untuk notifikasi

**Supported Providers:**
- Mailgun (recommended)
- SendGrid
- AWS SES
- Traditional SMTP

**Configuration:** Via .env (MAIL_*)

### FR-INT-2: PDF Generation
**Library:** barryvdh/laravel-dompdf atau mPDF

**Usage:**
- Invoice PDF generation
- Receipt PDF generation
- Prescription PDF export

**No external service needed** (on-server generation)

### FR-INT-3: Payment Gateway (Future)
**NOT in v1.0 scope, but architecture ready:**
- Midtrans (recommended untuk Indonesia)
- Stripe
- PaymentExpress

**Placeholder untuk future:**
```php
// In config/services.php
'midtrans' => [
    'client_key' => env('MIDTRANS_CLIENT_KEY'),
    'server_key' => env('MIDTRANS_SERVER_KEY'),
],
```

### FR-INT-4: SMS Notification (Optional, Not v1.0)
**If implemented in future:**
- Twilio atau Nexmo API
- Local SMS gateway integration

### FR-INT-5: Cloud Storage (Optional)
**S3-compatible storage untuk:**
- Invoice PDF archival
- Backup storage
- Image uploads (product gambar)

**Configuration:** Via Laravel Storage facade

---

## TESTING REQUIREMENTS

### Unit Tests
**Coverage Target:** > 80% untuk critical business logic

```php
// Tests/Unit/Services/InvoiceServiceTest.php
- Test invoice generation from visit
- Test tax calculation
- Test discount application
- Test payment settlement
```

### Feature Tests
```php
// Tests/Feature/VisitControllerTest.php
- Test create visit flow
- Test complete visit & generate invoice
- Test doctor cannot modify service price
- Test unauthorized access for kasir to master data
```

### API Tests
```php
// Tests/Feature/Api/PaymentControllerTest.php
- Test payment API
- Test authorization
- Test validation
```

### Manual Testing Checklist
**Before release:**
- [ ] User login/logout works
- [ ] Customer registration auto-creates account
- [ ] Visit creation & completion
- [ ] Invoice generation automatic
- [ ] Invoice PDF download works
- [ ] POS transaction complete flow
- [ ] Payment processing & change calculation
- [ ] Email notifications sent
- [ ] Master data CRUD (Owner only)
- [ ] Permission checks working (dokter tidak bisa ubah harga)
- [ ] Soft deletes tidak tampil (archived items)
- [ ] Pagination works
- [ ] Search & filter functional
- [ ] Mobile responsiveness
- [ ] Dark mode (if implemented)

---

## ERROR HANDLING & VALIDATION

### FR-ERR-1: Input Validation
**All inputs must be validated:**
- Required field checks
- Email format validation
- Phone format validation
- Numeric range validation
- File type & size validation
- Date range validation

**Implementation:**
```php
// Request class validation rules
public function rules() {
    return [
        'name' => 'required|string|max:255',
        'phone' => 'required|regex:/^[0-9]{10,}$/',
        'email' => 'nullable|email',
        'price' => 'required|numeric|min:0',
    ];
}
```

### FR-ERR-2: Business Logic Validation
- Cannot create visit untuk pet yang tidak ada
- Cannot complete billing jika belum ada items
- Cannot process payment melebihi invoice amount (untuk visit/billing)
- Cannot modify completed/paid transactions
- Cannot apply service/drug yang sudah archived

### FR-ERR-3: Error Messages
**User-friendly error messages:**
- Not technical/cryptic
- Actionable guidance
- Clear next steps

**Example:**
```
❌ WRONG: "FOREIGN KEY constraint failed"
✅ RIGHT: "Please select a customer before creating a visit"
```

### FR-ERR-4: Exception Handling
```php
// Custom exceptions
AuthorizationException
InsufficientStockException
DuplicateCustomerException
InvalidPaymentAmountException

// Centralized error handling via Laravel exception handler
```

### FR-ERR-5: API Error Responses
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "phone": ["Phone already exists"],
    "email": ["Invalid email format"]
  }
}
```

---

## CONSTRAINTS & LIMITATIONS

### Technical Constraints

1. **Single Database:**
   - PostgreSQL single instance (no sharding)
   - No distributed transactions
   - Scaling = vertical only (untuk v1)

2. **No Microservices:**
   - One Laravel app
   - One repository
   - One deployment unit

3. **Queue Processing:**
   - Database-backed queue (dapat di-scale ke Redis jika perlu)
   - No mandatory external broker

4. **File Storage:**
   - Local file system default
   - S3 optional (tidak mandatory)

5. **Session Management:**
   - Database sessions default
   - Redis sessions optional

### Business Constraints

1. **Master Data Integrity:**
   - Service price fixed saat digunakan di visit (immutable untuk past transactions)
   - Drug unit tidak bisa diubah setelah created
   - Archived items tidak tampil di dropdown untuk new transactions

2. **Transaction Immutability:**
   - Completed visit tidak bisa di-edit (hanya soft-delete by Owner)
   - Paid invoice tidak bisa di-edit (for audit compliance)
   - POS order tidak bisa di-edit setelah finalized

3. **Permission Rigidity:**
   - Dokter TIDAK PERNAH bisa mengubah harga
   - Kasir TIDAK PERNAH bisa mengubah master data
   - Hanya Owner yang punya full akses config

4. **Stock Management:**
   - Stock tidak boleh minus (reject jika insufficient)
   - Stock adjustment hanya untuk Owner/Admin

### Operational Constraints

1. **No Appointment System:**
   - v1 hanya support walk-in dan existing bookings manual
   - Scheduling bisa di-add di v2

2. **No Multi-location:**
   - Single klinik per deployment
   - Multi-location = separate deployment/database

3. **No Advanced Medical Features:**
   - No lab integration
   - No imaging system
   - No telemedicine/consultation video
   - Simple notes only (bukan formal EMR)

4. **No Supply Chain:**
   - No purchase order system
   - No vendor management
   - Stock adjustment manual only

5. **Simple Customer Portal:**
   - Read-only history/records
   - Cannot request appointments
   - Cannot book pet hotel/grooming
   - Cannot join loyalty program (v1)

---

## APPENDIX

### Glossary

| Term | Definition |
|------|------------|
| **Visit** | Kunjungan customer ke klinik untuk layanan medis |
| **Billing** | Perawatan bertahap (rawat inap, pet hotel) dengan items bertambah |
| **POS Order** | Penjualan retail products tanpa need customer account |
| **Invoice** | Tagihan generated dari Visit atau Billing |
| **Service** | Tindakan medis (vaksin, grooming, konsultasi, operasi) |
| **Drug** | Obat atau medicinal item untuk resep |
| **Product** | Retail item (makanan, vitamin, aksesori) |
| **Soft Delete** | Archive data (tidak dihapus, hanya status ARCHIVED) |
| **Master Data** | Konfigurasi bisnis (services, drugs, products) |
| **Audit Trail** | Rekam jejak perubahan data untuk compliance |
| **RBAC** | Role-Based Access Control |
| **API** | Application Programming Interface untuk future mobile app |

### File Naming Conventions

**Controllers:**
```
MasterDataController.php (untuk CRUD master data)
VisitController.php
BillingController.php
PaymentController.php
ReportController.php
PortalController.php
AuthController.php
```

**Models:**
```
Visit.php
VisitItem.php
Billing.php
BillingItem.php
Service.php
Drug.php
Product.php
Customer.php
Pet.php
Invoice.php
Payment.php
```

**Routes:**
```
routes/web.php          - Web routes
routes/api.php          - API routes (future mobile)
routes/auth.php         - Auth routes
```

**Views:**
```
resources/views/admin/     - Owner panel
resources/views/dokter/    - Doctor interface
resources/views/kasir/     - Cashier interface
resources/views/portal/    - Customer portal
resources/views/emails/    - Email templates
resources/views/components/ - Reusable components
```

**Database:**
```
database/migrations/   - Schema migrations
database/seeders/      - Initial data seeders
database/factories/    - Test data factories
```

### Development Commands Reference

```bash
# Setup
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed

# Development
php artisan serve
php artisan tinker (untuk explore)

# Database
php artisan migrate:fresh --seed (reset untuk development)
php artisan make:migration create_table_name
php artisan make:model ModelName -m (dengan migration)
php artisan make:seeder SeederName

# Code Generation
php artisan make:controller ControllerName
php artisan make:request StoreUserRequest
php artisan make:model ModelName
php artisan make:observer ModelNameObserver --model=ModelName

# Testing
php artisan test
php artisan test --filter=FeatureName

# Production
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Monitoring
php artisan queue:work --daemon
tail -f storage/logs/laravel.log
```

---

## DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-23 | System | Initial PRD document |

**Status:** ✅ APPROVED FOR DEVELOPMENT

**Last Review:** 2026-07-23

**Next Review:** Upon major feature addition or significant scope change

---

**END OF DOCUMENT**

---

### How to Use This PRD

1. **For Developers:**
   - Reference database schema untuk migration creation
   - Follow API specifications untuk endpoint implementation
   - Use frontend specs untuk UI consistency
   - Check constraints untuk understanding business rules

2. **For Project Managers:**
   - Use functional requirements untuk progress tracking
   - Reference scope untuk managing expectations
   - Check constraints untuk identifying risks

3. **For QA/Testing:**
   - Use testing requirements untuk test case creation
   - Reference business logic validation untuk test scenarios
   - Use error handling untuk negative test cases

4. **For DevOps:**
   - Follow deployment checklist
   - Implement monitoring & logging as specified
   - Setup backup strategy
   - Configure security measures

---

**This PRD is a living document. Updates should be tracked in the Version Control table above.**
