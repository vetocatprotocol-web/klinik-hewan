# PRD - Fitur Dashboard PetCare (UPDATED)

> **Version:** 2.0  
> **Last Updated:** July 2026  
> **Status:** ACTIVE - Source of Truth untuk Development  
> **Revision History:** Restructuring dari 5-role system (OWNER, DOKTER, KASIR, ADMIN, CUSTOMER) ke 4-role system dengan fraud prevention controls

---

## 1. IKHTISAR SISTEM

**PetCare** adalah aplikasi web manajemen klinik hewan yang dibangun dengan Next.js (App Router), Prisma ORM, PostgreSQL, dan NextAuth (JWT strategy). Sistem ini menyediakan **4 dashboard terpisah** untuk role yang jelas tanpa overlap, dengan kontrol akses berbasis role dan fraud prevention mechanisms.

### Prinsip Desain Utama

```
1. CLEAR SEPARATION OF DUTIES
   ├── Setiap role memiliki tanggung jawab spesifik, tidak ada overlap
   ├── Data saling terhubung dalam satu sistem yang terintegrasi
   ├── No workflow conflicts atau duplicate responsibilities
   └── Audit trail lengkap untuk semua actions

2. FRAUD PREVENTION & GOVERNANCE
   ├── OWNER memiliki kendali penuh (master data, pricing, approvals)
   ├── KASIR execute transactions (tidak bisa modify pricing/policies)
   ├── DOKTER fokus clinical (tidak ada akses financial)
   ├── CUSTOMER self-service (data isolation)
   └── Approval workflow untuk perubahan kritis

3. SINGLE SOURCE OF TRUTH
   ├── Setiap data entity disimpan sekali (no duplication)
   ├── All changes tracked & timestamped
   ├── Full audit trail immutable
   └── Historical data preserved for compliance
```

### Arsitektur Dashboard

| Area | Path Prefix | Role | Purpose |
|------|-------------|------|---------|
| Internal Dashboard | `/dashboard`, `/visits`, `/invoices`, dll | OWNER, DOKTER, KASIR | Management, Operations |
| Owner Control | `/owner/master`, `/owner/approvals`, `/owner/settings` | OWNER | Full system control, approvals |
| Customer Portal | `/portal/dashboard`, `/portal/pets`, dll | CUSTOMER | Self-service, booking |
| Authentication | `/login`, `/forgot-password`, `/reset-password` | Public | User authentication |

---

## 2. SISTEM ROLE & PERMISSIONS

### 2.1 Daftar Role (4 ROLES ONLY)

| Role | Keterangan | Email Seed | Tanggung Jawab Utama |
|------|------------|-----------|-------------------|
| **OWNER** | Pemilik klinik, kontrol penuh sistem | admin@klinik.com | Oversight, approval, settings, master data |
| **DOKTER** | Dokter hewan, fokus klinis | dokter@klinik.com | Visits, medical records, prescriptions |
| **KASIR** | Kasir, finance & operations | kasir@klinik.com | Transactions, inventory, hotel, suppliers |
| **CUSTOMER** | Pelanggan, self-service portal | pelanggan@klinik.com | Manage pets, book appointments, view invoices |

---

### 2.2 Permission Matrix (Source of Truth)

```
┌──────────────────────────────┬────────┬───────┬──────┬──────────┐
│ Permission                   │ OWNER  │ KASIR │ DOK  │ CUSTOMER │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ VIEW_DASHBOARD               │   ✅   │  ✅   │  ✅  │    ✅    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ CLINICAL - DOCTOR ONLY       │        │       │      │          │
│ MANAGE_VISITS                │   ✅   │  ❌   │  ✅  │    ❌    │
│ MANAGE_PRESCRIPTIONS         │   ✅   │  ❌   │  ✅  │    ❌    │
│ MANAGE_APPOINTMENTS          │   ✅   │  ❌   │  ✅  │    ✅    │
│ VIEW_MEDICAL_RECORDS         │   ✅   │  ❌   │  ✅  │    ❌    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ FINANCE - KASIR              │        │       │      │          │
│ MANAGE_BILLING               │   ✅   │  ✅   │  ❌  │    ❌    │
│ MANAGE_INVOICES              │   ✅   │  ✅   │  ❌  │    ❌    │
│ MANAGE_PAYMENTS              │   ✅   │  ✅   │  ❌  │    ❌    │
│ MANAGE_POS                   │   ✅   │  ✅   │  ❌  │    ❌    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ OPERATIONS - KASIR           │        │       │      │          │
│ MANAGE_CUSTOMERS             │   ✅   │  ✅   │  ❌  │    ❌    │
│ MANAGE_STOCK                 │   ✅   │  ✅   │  ❌  │    ❌    │
│ MANAGE_HOTEL                 │   ✅   │  ✅   │  ❌  │    ✅    │
│ MANAGE_SUPPLIERS             │   ✅   │  ✅   │  ❌  │    ❌    │
│ SUGGEST_PRICE_CHANGES        │   ✅   │  ✅   │  ❌  │    ❌    │
│ REQUEST_STOCK_ADJUSTMENT     │   ✅   │  ✅   │  ❌  │    ❌    │
│ SUBMIT_DAILY_RECONCILIATION  │   ✅   │  ✅   │  ❌  │    ❌    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ MASTER DATA - OWNER ONLY     │        │       │      │          │
│ MANAGE_SERVICES              │   ✅   │  ❌   │  ❌  │    ❌    │
│ MANAGE_DRUGS                 │   ✅   │  ❌   │  ❌  │    ❌    │
│ MANAGE_PRODUCTS              │   ✅   │  ❌   │  ❌  │    ❌    │
│ MANAGE_CATEGORIES            │   ✅   │  ❌   │  ❌  │    ❌    │
│ MANAGE_PAYMENT_METHODS       │   ✅   │  ❌   │  ❌  │    ❌    │
│ VIEW_SERVICES (read-only)    │   ✅   │  ✅   │  ❌  │    ❌    │
│ VIEW_DRUGS (read-only)       │   ✅   │  ✅   │  ❌  │    ❌    │
│ VIEW_PRODUCTS (read-only)    │   ✅   │  ✅   │  ❌  │    ❌    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ APPROVAL & FRAUD PREVENTION  │        │       │      │          │
│ APPROVE_PRICE_CHANGES        │   ✅   │  ❌   │  ❌  │    ❌    │
│ APPROVE_DISCOUNTS            │   ✅   │  ❌   │  ❌  │    ❌    │
│ APPROVE_STOCK_ADJUSTMENT     │   ✅   │  ❌   │  ❌  │    ❌    │
│ APPROVE_SUPPLIERS            │   ✅   │  ❌   │  ❌  │    ❌    │
│ REVIEW_DAILY_RECONCILIATION  │   ✅   │  ❌   │  ❌  │    ❌    │
│ APPLY_DISCOUNT (limited)     │   ✅   │  ✅*  │  ❌  │    ❌    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ REPORTING                    │        │       │      │          │
│ VIEW_REPORTS_ALL             │   ✅   │  ✅   │  🔍  │    ❌    │
│ VIEW_AUDIT_LOGS              │   ✅   │  ❌   │  ❌  │    ❌    │
│ VIEW_DISCOUNT_HISTORY        │   ✅   │  ❌   │  ❌  │    ❌    │
│ VIEW_PRICE_CHANGE_HISTORY    │   ✅   │  ❌   │  ❌  │    ❌    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ SYSTEM ADMIN - OWNER ONLY    │        │       │      │          │
│ MANAGE_USERS                 │   ✅   │  ❌   │  ❌  │    ❌    │
│ MANAGE_PERMISSIONS           │   ✅   │  ❌   │  ❌  │    ❌    │
│ MANAGE_SETTINGS              │   ✅   │  ❌   │  ❌  │    ❌    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ CUSTOMER SELF-SERVICE        │        │       │      │          │
│ MANAGE_MY_PETS               │   ✅   │  ❌   │  ❌  │    ✅    │
│ MANAGE_MY_APPOINTMENTS       │   ✅   │  ❌   │  ❌  │    ✅    │
│ VIEW_MY_INVOICES             │   ✅   │  ❌   │  ❌  │    ✅    │
└──────────────────────────────┴────────┴───────┴──────┴──────────┘

Keterangan:
✅ = Full Access (Create, Read, Update, Delete)
🔍 = Read Only / View Only (limited reports only, not all)
❌ = No Access
✅* = Limited by policy/threshold (e.g., discount < Rp 1M)
```

---

### 2.3 Route Access Control

```typescript
// src/middleware.ts - AUTHORITY

const ROLE_ROUTES: Record<UserRole, string[]> = {
  OWNER: [],  // Full access to all routes, no restrictions

  DOKTER: [
    "/dashboard",
    "/visits",
    "/customers",        // view-only, for context
    "/appointments",
    "/prescriptions",
    "/medical-records",
    "/notifications"
  ],

  KASIR: [
    "/dashboard",
    "/invoices",
    "/payments",
    "/pos",
    "/customers",        // full CRUD access
    "/stock",
    "/master",           // view-only
    "/suppliers",
    "/hotel",
    "/reconciliation",
    "/notifications"
  ],

  CUSTOMER: [
    "/portal/dashboard",
    "/portal/pets",
    "/portal/appointments",
    "/portal/invoices",
    "/portal/prescriptions",
    "/portal/hotel-bookings",
    "/portal/profile"
  ]
};

// OWNER dapat redirect ke /dashboard atau /owner/dashboard
// Automatic based on role saat login
```

---

## 3. DASHBOARD PER ROLE

### 3.1 DOKTER DASHBOARD

**Path:** `/dashboard`  
**Purpose:** Clinical Operations & Patient Management

#### Sidebar Navigation (5 items)

| # | Label | Path | Icon |
|---|-------|------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | Appointments | `/appointments` | Calendar |
| 3 | Visits | `/visits` | Stethoscope |
| 4 | Patients | `/customers` | Users |
| 5 | Prescriptions | `/prescriptions` | FileText |

#### Dashboard Utama - Key Sections

```
🏥 DOKTER DASHBOARD

┌─────────────────────────────────────────────────────┐
│ 📊 TODAY'S CLINICAL OVERVIEW                        │
├─────────────────────────────────────────────────────┤
│ • Total Appointments Today: 8 (3 completed)         │
│ • Urgent Cases: 2                                   │
│ • Follow-ups Needed: 3                              │
│ • Hospitalized Pets: 1                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🗓️ SCHEDULE & QUEUE                                 │
├─────────────────────────────────────────────────────┤
│ • Appointment queue (time-based)                    │
│ • Next 5 appointments dengan pet info               │
│ • Quick actions: Start visit, reschedule            │
│ • Show doctor's available slots                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⚠️ ALERTS & ACTION ITEMS                            │
├─────────────────────────────────────────────────────┤
│ • Vaccination due soon (next 7 days)                │
│ • Follow-up visits needed                           │
│ • High-risk patients                                │
│ • Pending prescription approvals                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📋 RECENT VISITS                                    │
├─────────────────────────────────────────────────────┤
│ Last 5 visits (pet name, owner, diagnosis, status) │
│ Quick access to patient records                     │
└─────────────────────────────────────────────────────┘
```

#### Features Tersedia

**APPOINTMENTS (NEW)**
- View schedule (calendar & list view)
- Book appointment (select time slot, customer, pet)
- Manage slots (based on dokter's availability)
- Mark as completed
- Reschedule if needed
- No-show tracking

**VISITS (Core Clinical)**
- Create new visit (from appointment atau walk-in)
- Input medical data:
  - Chief complaint
  - Physical examination notes
  - Vital signs (temperature, heart rate, weight)
  - Diagnosis & treatment plan
  - Prescription (auto-linked)
  - Services applied
- Complete visit (auto-triggers invoice generation)
- View past visits (medical history)
- Print visit report (PDF)
- Medical records immutable (audit trail)

**PATIENTS**
- View patient list (pets with owner info)
- Search by pet name, owner name, phone
- View patient medical history:
  - All visits
  - Vaccination records
  - Prescriptions
  - Allergies/contraindications
  - Weight tracking
  - Medical conditions
- NO EDIT - view-only, untuk context saja

**PRESCRIPTIONS**
- Auto-generated dari completed visits
- List all prescriptions (active, completed, cancelled)
- View prescription details:
  - Drug name, dosage, duration, instructions
  - Pet info, owner contact
  - Date issued, expiry
- Print prescription (PDF)
- Mark as completed/cancelled

**MEDICAL RECORDS**
- Full patient medical history (read-only)
- Search & filter by date range
- View all medical events:
  - Visits, diagnoses, treatments
  - Prescriptions, medications
  - Allergies, contraindications
  - Vaccination records
  - Weight & vital signs trends
- Export medical history (for referral/transfer)
- NO BILLING INFO (completely separate from clinical)

**REPORTS** (Clinical only)
- Diagnose breakdown (top 10 diagnoses)
- Service utilization (most common treatments)
- Species breakdown (dogs, cats, birds, etc)
- Vaccination trends
- Follow-up effectiveness
- Monthly visit statistics

#### Permissions & Restrictions

```
✅ CAN DO:
- Create & complete visits
- Add prescriptions
- View appointments & schedule
- Manage own schedule/availability
- View patient medical records
- Print clinical reports

❌ CANNOT DO:
- View financial/billing info
- Change prices
- Approve discounts
- Access POS/retail
- See payment status
- Manage inventory
- Create/edit users
- Access system settings

📍 VIEW ONLY:
- Customer contact info (name, phone, address) - for referral/follow-up
- Pet basic info (name, species, weight) - for context
- Nothing related to money/billing
```

---

### 3.2 KASIR DASHBOARD

**Path:** `/dashboard`  
**Purpose:** Finance, Operations, & Administrative Control

#### Sidebar Navigation (9 items)

| # | Label | Path | Icon |
|---|-------|------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | POS/Transactions | `/pos` | ShoppingCart |
| 3 | Invoices & Payments | `/invoices` | Receipt |
| 4 | Receivables | `/invoices?status=UNPAID` | CircleDollarSign |
| 5 | Customers | `/customers` | Users |
| 6 | Inventory | `/stock` | Warehouse |
| 7 | Hotel | `/hotel` | Building2 |
| 8 | Suppliers | `/suppliers` | Truck |
| 9 | Daily Close | `/reconciliation` | CheckCircle |

#### Dashboard Utama - Key Sections

```
💰 KASIR DASHBOARD

┌─────────────────────────────────────────────────────┐
│ 📊 TODAY'S FINANCIAL SUMMARY                        │
├─────────────────────────────────────────────────────┤
│ • Total Revenue (Today): Rp 15,500,000              │
│   ├─ POS Sales: Rp 8,200,000 (53%)                 │
│   ├─ Invoices Paid: Rp 7,300,000 (47%)             │
│   └─ Payment Methods: Cash, Card, Transfer         │
│ • Transactions Count: 24                            │
│ • Avg Transaction Value: Rp 645,833                │
│ • Pending Payments: Rp 12,400,000 (45 invoices)   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🔔 ALERTS & ACTION ITEMS                            │
├─────────────────────────────────────────────────────┤
│ • Pending Reconciliation (from yesterday)           │
│ • Overdue Invoices (> 30 days): Rp 2,100,000      │
│ • Stock Critical Items: 5 products                  │
│ • Pending Supplier Orders: 3                        │
│ • Hotel Checkouts Today: 2 bookings                │
│ • Unapproved Discounts: 1                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💳 PAYMENT COLLECTION STATUS                        │
├─────────────────────────────────────────────────────┤
│ • Collections Rate (This Week): 87%                 │
│ • Receivables Aging:                                │
│   ├─ 0-30 days: Rp 8,900,000 (72%)                 │
│   ├─ 31-60 days: Rp 2,400,000 (19%)                │
│   ├─ 61-90 days: Rp 900,000 (7%)                   │
│   └─ > 90 days: Rp 200,000 (2%)                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📦 INVENTORY HEALTH                                 │
├─────────────────────────────────────────────────────┤
│ • Total Inventory Value: Rp 45,600,000              │
│ • Stock Health:                                     │
│   ├─ Normal: 34 products                            │
│   ├─ Low Stock: 8 products (needs reorder)          │
│   └─ Critical: 2 products (immediate order)         │
│ • Pending PO (from suppliers): 3                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🏨 HOTEL OCCUPANCY                                  │
├─────────────────────────────────────────────────────┤
│ • Rooms Available: 3/10 (30% occupancy)             │
│ • Revenue (This Month): Rp 8,400,000                │
│ • Upcoming Checkouts: 2 (today)                     │
│ • Pending Bookings: 1                               │
└─────────────────────────────────────────────────────┘
```

#### Features Tersedia

**💳 POS/TRANSACTIONS (Complete Point of Sale)**
- Product catalog (search, filter by category)
- Shopping cart:
  - Add items, adjust quantity
  - Remove items
  - Real-time total calculation
- Discounts:
  - Apply discount (amount or %)
  - Limited by policy (default: max Rp 1M or 20%)
  - Discount > threshold requires OWNER approval
  - Discount logged for audit
- Pricing:
  - Display unit price (from OWNER-managed master)
  - Cannot edit pricing (view-only)
  - Quantity × unit price = line total
- Taxes:
  - Auto-calculate based on settings (can be disabled)
  - Show tax amount in breakdown
- Payment processing:
  - Select payment method (Cash, Card, Transfer, Check)
  - Input payment amount
  - Calculate change (if cash)
  - Multiple payment methods per transaction (partial)
- Receipt:
  - Auto-generate receipt
  - Print via dialog
  - Save to invoice system
  - Email option (if customer email available)
- Audit trail:
  - All POS transactions logged
  - Who, what, when, how much
  - Cannot delete (only void with reason)

**📋 INVOICES & PAYMENTS (Receivables Management)**
- Invoice list:
  - Filter by status (UNPAID, PARTIAL, PAID)
  - Filter by date range
  - Search by invoice number, customer name
  - Sort by amount, date, age
- Invoice detail:
  - Customer info
  - Invoice items (service, drug, product)
  - Subtotal, tax, discount, total
  - Payment status & history
  - Payment method breakdown
  - Notes
- Payment processing:
  - Record partial payment
  - Record full payment
  - Select payment method
  - Print receipt for payment
  - Payment confirmation (email if available)
- Aging analysis:
  - Overdue invoices
  - Payment terms reminder
  - Follow-up tools (send SMS/email reminder)
- No CREATING invoices directly (auto-generated dari visits/billing/POS)

**💰 RECEIVABLES (Collections Tracking)**
- Aging report (0-30, 31-60, 61-90, >90 days)
- Top debtors (by amount)
- Overdue tracking
- Payment collection rate (%)
- Customer payment history (reliability score)
- Batch payment reminders (SMS/email)

**👥 CUSTOMERS (Administrative Management)**
- Customer list (search, filter by status)
- Customer profile (name, phone, email, address, city, postal code)
- View customer payment history
- View customer invoices & visits
- View customer pets
- Add new customer (with contact info)
- Edit customer profile
- Mark as inactive (soft delete for audit)
- Payment history (on-time vs late payer)

**📦 INVENTORY MANAGEMENT (Full Control)**

*Stock Monitoring:*
- Current stock levels (all products)
- Filter by stock status (normal, low, critical)
- Reorder points visualization
- Stock valuation (total value)
- Stock movement history (daily)

*Stock Adjustments:*
- Adjust stock (add/reduce quantity)
- Input reason (POS_SOLD, BILLING_SOLD, DAMAGED, RETURN, OPNAME_ADJUST, OTHER)
- Add notes (explanation)
- Adjustment automatically recorded & logged
- Adjustment > threshold requires OWNER approval

*Stock History:*
- All movements tracked (date, qty, reason, who, notes)
- Filter by product, date range, reason
- Audit trail (immutable)
- Monthly opname reconciliation
- Variance tracking (physical count vs system)

*Reorder Management:*
- Set reorder points per product
- Auto-alert when stock < reorder point
- Create purchase orders (to suppliers)
- Track PO status

**🤝 SUPPLIER MANAGEMENT**

*Supplier Master:*
- Supplier list (CRUD)
- Supplier info (name, contact, phone, email, address)
- Payment terms (e.g., Net 30, Net 60)
- Product specialization (drugs, products, etc)
- Performance metrics (on-time delivery rate, quality score)

*Purchase Orders:*
- Create PO (select supplier, items, quantities)
- PO approval workflow:
  - KASIR create PO
  - If PO > budget threshold → OWNER approval needed
  - Auto-approve if < threshold
- PO tracking (status: PENDING, RECEIVED, PARTIAL, CANCELLED)
- View PO history

*Goods Receiving:*
- Record goods received (from PO)
- Mark items received (full or partial)
- Update stock automatically
- Quality check (accept/reject items)
- Generate GR note

*Supplier Performance:*
- On-time delivery rate (%)
- Quality score (defect/return rate)
- Price competitiveness
- Lead time average
- Relationship value (total spend)

**🏨 HOTEL MANAGEMENT**

*Hotel Bookings:*
- Calendar view (room occupancy)
- Create booking (customer, pet, room, check-in, check-out date)
- Booking status (CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)
- Room assignment (select available room)
- Daily rate applied automatically
- Add services (grooming, extra food, medication, playtime)

*Hotel Rooms:*
- Room list (name, type, capacity, daily rate, amenities)
- Room status (available, occupied, maintenance)
- Occupancy tracking (current, upcoming)
- Maintenance schedule (mark room as maintenance)
- Rate management (view pricing set by OWNER)

*Hotel Charges:*
- Auto-calculate charges:
  - Length of stay × daily rate
  - Add-on services (+amount each)
- Generate hotel invoice (separate line item in customer invoice)
- Pet care notes (daily observations)

*Hotel Reports:*
- Occupancy rate (%)
- Revenue (daily, weekly, monthly)
- Peak periods analysis
- Average length of stay
- Customer retention (repeat bookings)

**⚙️ DAILY RECONCILIATION (End-of-Day Process)**

*Close Process:*
- Summary of day's activities
- POS total vs expected
- Invoice payments recorded
- Cash count entry (physical count)
- Card/Transfer verification (match to bank)
- Discrepancies identification

*Reconciliation Form:*
- Expected POS: [auto-calculated from transactions]
- Actual POS: [KASIR input from receipt counter]
- Expected Cash: [auto from payment methods]
- Actual Cash: [KASIR count]
- Expected Card: [auto from CC processor]
- Actual Card: [KASIR verify]
- Variance calculation (auto)
- Notes (for discrepancies)
- Submit for OWNER review

*Workflow:*
- KASIR submit → status PENDING
- OWNER review → can APPROVE or REQUEST REVISION
- If APPROVED → lock the day's transactions (immutable)
- If REQUEST REVISION → go back to KASIR
- Historical record kept for audit

**📊 REPORTS (Financial & Operational)**
- Daily revenue breakdown
- Revenue by payment method
- Revenue by service/product category
- Top selling items (products & services)
- Receivables aging
- Collections rate
- Inventory valuation
- Inventory turnover (FIFO/weighted average)
- Supplier performance
- Hotel occupancy & revenue
- All exportable to CSV/PDF

#### Kasir CANNOT Do

```
❌ CANNOT:
- Edit/create master data (services, drugs, products, categories)
- Change pricing (view-only, can only suggest)
- Approve price changes (only OWNER)
- Approve discounts > policy limit
- Create/edit users
- Access audit logs
- Change system settings
- View clinical/medical records details
- Approve stock adjustments
- Approve supplier additions
- Create new payment methods
- Override OWNER approvals

🔍 VIEW ONLY:
- Master data (services, drugs, products) - prices, costs
- Price change history (see what OWNER approved)
- Stock adjustment approvals (track status)
- System settings (read-only, no edit)
- Doctor availability/schedule
```

#### Permissions & Workflow

```
KASIR WORKFLOW - No Conflicts:

1. PRICING
   ├─ View master data (OWNER set)
   ├─ Suggest price change (with reason)
   │  └─ Submit to OWNER for approval
   ├─ Cannot apply until OWNER approves
   └─ All suggestions tracked

2. DISCOUNTS
   ├─ Apply discount (within policy limit)
   │  └─ Auto-approve if < threshold
   ├─ Request approval if > threshold
   │  └─ OWNER reviews & approves
   └─ All discounts logged for audit

3. STOCK
   ├─ Record sold items (POS & billing)
   │  └─ Auto-adjusts inventory
   ├─ Report damaged/waste
   │  └─ Request adjustment approval
   ├─ Physical count discrepancies
   │  └─ Submit for OWNER review
   └─ Cannot directly edit (only request)

4. SUPPLIERS
   ├─ Create PO (order from supplier)
   │  └─ Auto-approve if < budget
   │  └─ Request OWNER approval if > budget
   ├─ Receive goods (match to PO)
   │  └─ Auto-update stock
   ├─ Suggest new supplier
   │  └─ OWNER verification & approval
   └─ Cannot add supplier directly

5. RECONCILIATION
   ├─ Submit end-of-day close
   │  └─ All transactions locked
   ├─ OWNER reviews
   │  └─ Approves or requests revision
   ├─ If approved → day is finalized
   ├─ If revision needed → go back to KASIR
   └─ Historical record immutable
```

---

### 3.3 OWNER DASHBOARD

**Path:** `/dashboard` atau `/owner/dashboard`  
**Purpose:** Full System Oversight, Control, Approvals, & Strategic Management

#### Sidebar Navigation (12+ items)

| # | Label | Path | Icon |
|---|-------|------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | Approvals | `/owner/approvals` | CheckCircle |
| 3 | Master Data | `/owner/master` | Settings |
| 4 | Customers | `/customers` | Users |
| 5 | Financial Reports | `/reports/financial` | BarChart3 |
| 6 | Operational Reports | `/reports/operational` | TrendingUp |
| 7 | Daily Reconciliation | `/reconciliation` | Wallet |
| 8 | Audit Logs | `/audit-logs` | FileText |
| 9 | Suppliers | `/suppliers` | Truck |
| 10 | Settings | `/settings` | Settings |
| 11 | Users | `/settings/users` | UserCog |

#### Dashboard Utama - Key Sections

```
👑 OWNER DASHBOARD - EXECUTIVE OVERVIEW

┌─────────────────────────────────────────────────────┐
│ 📊 KEY PERFORMANCE INDICATORS (KPI)                 │
├─────────────────────────────────────────────────────┤
│ Monthly Revenue:                                     │
│ • This Month: Rp 125,400,000                        │
│ • Last Month: Rp 118,900,000 (+5.4%)                │
│ • YTD: Rp 1,450,200,000                             │
│                                                      │
│ Customer Metrics:                                    │
│ • Total Active Customers: 342                        │
│ • New This Month: 18                                 │
│ • Repeat Rate: 67%                                   │
│                                                      │
│ Operations:                                          │
│ • Total Pets: 487                                    │
│ • Monthly Visits: 156                                │
│ • Hotel Occupancy: 62%                               │
│ • Collection Rate: 89%                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🚨 CRITICAL ALERTS & ACTION ITEMS                   │
├─────────────────────────────────────────────────────┤
│ APPROVALS PENDING:                                   │
│ • Price change requests: 2 pending                  │
│ • Discount requests: 1 pending (Rp 2,000,000)      │
│ • Stock adjustments: 3 pending                      │
│ • Supplier additions: 1 pending                      │
│ • Reconciliation (2 days ago): needs review         │
│                                                      │
│ SYSTEM ALERTS:                                       │
│ • Cash discrepancy detected (yesterday): Rp 50k     │
│ • High discounts this week: Rp 4,500,000 (3% rev)  │
│ • Overdue payables (suppliers): 1 PO                │
│ • Failed backups: Last backup 2 days ago            │
│ • API errors (last 24h): 2 errors                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📈 REVENUE TRENDS (30 days)                         │
├─────────────────────────────────────────────────────┤
│ Chart: Daily revenue (line chart)                    │
│ • Avg daily: Rp 4,180,000                           │
│ • Highest: Rp 7,200,000 (day 15)                    │
│ • Lowest: Rp 2,100,000 (day 8)                      │
│ • Trend: +2.3% week-over-week                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💰 FINANCIAL SNAPSHOT                               │
├─────────────────────────────────────────────────────┤
│ Receivables: Rp 23,400,000 (45 invoices)            │
│ Payables: Rp 8,200,000 (from suppliers)             │
│ Cash Balance: Rp 156,700,000                         │
│ Inventory Value: Rp 45,600,000                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📋 APPROVAL WORKFLOW QUEUE                          │
├─────────────────────────────────────────────────────┤
│ Quick action items (with timestamps)                │
│ [Approve] [Reject] buttons for each                 │
└─────────────────────────────────────────────────────┘
```

#### Features Tersedia

**👁️ FULL SYSTEM OVERSIGHT**
- View everything (no restrictions)
- All roles' data accessible
- Full audit trail of all actions
- System health monitoring
- Backup status & recovery options

**⚙️ MASTER DATA MANAGEMENT (COMPLETE CONTROL)**

*Services Management:*
- CRUD services (create, view, edit, archive)
- Set pricing (primary control point for fraud prevention)
- Set cost (for margin calculation)
- Categorize (8 categories)
- View change history (all modifications tracked)
- Version control (revert if needed)
- Bulk import/export (Excel)

*Drugs Management:*
- CRUD drugs (create, view, edit, archive)
- Set pricing per unit
- Set cost per unit
- Set minimum stock levels
- Link to suppliers (who supplies this drug)
- Expiry management
- Unit type (TABLET, KAPSULA, BOTOL, VIAL, AMPUL, GRAM, ML, TETES, LAINNYA)
- View change history & version control
- Bulk operations

*Products Management:*
- CRUD products (create, view, edit, archive)
- Pricing (retail price set by OWNER)
- Cost tracking (for margin analysis)
- Margin targets (e.g., minimum 30% margin)
- Categories management
- Reorder point settings
- Stock valuation (FIFO/LIFO/weighted average)
- Image management (product photos)
- Barcode management (for POS scanning)
- View change history & version control

*Categories Management:*
- Create/edit/delete categories (services, products)
- Set default margins per category
- Organize master data

**✅ APPROVAL WORKFLOW MANAGEMENT**

*Price Change Approvals:*
- Review pending price changes (suggested by KASIR)
- See current vs proposed price
- See justification from KASIR
- Approval options:
  - APPROVE (apply immediately, logged)
  - REQUEST REVISION (send back to KASIR for reconsideration)
  - REJECT (with notes why)
- All decisions timestamped & tracked
- Impact analysis (how many invoices affected)

*Discount Approvals:*
- Review large discount requests (> policy threshold)
- See discount amount, percentage, customer
- See reason from KASIR
- Approve/Reject with notes
- Track all discounts applied

*Stock Adjustment Approvals:*
- Review stock adjustment requests
- See quantity, reason, notes
- Approve/Reject
- Track variance patterns (detect theft?)

*Supplier Approvals:*
- Review new supplier proposals from KASIR
- Verify credentials, payment terms
- Approve/Reject addition
- Track supplier relationships

*Reconciliation Review:*
- Review daily reconciliation from KASIR
- Check for discrepancies
- Approve if balanced
- Request revision if issues
- Flag unusual patterns

**💳 PRICING & FINANCIAL CONTROLS**

*Price Monitoring:*
- Daily price change report
- Comparison with competitors (if tracking)
- Margin analysis (target vs actual)
- Anomaly detection:
  - Price changes outside normal range
  - Discounts unusually high
  - Revenue variance from forecast
- Alert system for suspicious patterns

*Discount Tracking:*
- All discounts applied (amount, reason, who, when)
- Summary (total discount %, by customer, by KASIR)
- Policy enforcement (alerts if discount > policy)
- Relationship analysis (who gets most discount?)

*Cost Management:*
- Drug & product cost tracking
- Margin analysis (expected vs actual)
- Supplier cost comparison
- Purchasing efficiency
- Negotiation support (data to negotiate better pricing)

**📊 COMPREHENSIVE REPORTING**

*Financial Reports:*
- Daily revenue breakdown (cash, card, transfer)
- Revenue by service type
- Revenue by product category
- Revenue trends (daily, weekly, monthly)
- Receivables aging (0-30, 31-60, 61-90, >90 days)
- Collections rate (% on time)
- Profit margin analysis
- Cash flow projection
- YTD vs forecast
- All exportable to PDF/CSV/Excel

*Operational Reports:*
- Visit statistics (by doctor, by service, by pet type)
- Doctor productivity (visits/day, avg treatment time)
- Customer metrics (new, repeat, churn rate)
- Pet demographics (species, breed distribution)
- Hotel occupancy & revenue
- Inventory valuation
- Inventory turnover
- Supplier performance
- Stock aging (FIFO analysis)
- Top selling items

*Compliance Reports:*
- Audit log (all actions: who, what, when, why)
- User activity (logins, changes, approvals)
- Price change history (full trail)
- Discount history (all applied, with reasons)
- Payment reconciliation (expected vs actual)
- Backup status & recovery test results
- Tax compliance (invoices, amounts, dates)

**🔐 AUDIT & COMPLIANCE**

*Audit Logs:*
- Complete log of all system actions
- Filter by:
  - User (which KASIR, DOKTER)
  - Action type (create, update, delete, archive, payment)
  - Entity type (customer, visit, invoice, product, drug, service)
  - Date range
- View details:
  - Who did it, when, what changed
  - Old value → new value
  - IP address, user agent (for security)
- Immutable (cannot modify audit logs)
- Export for regulatory/legal compliance

*User Activity:*
- Login history (timestamp, IP, device)
- Actions performed (by user, by day)
- Suspicious activity alerts (multiple failed logins, access outside hours)
- Account lockout history

*Data Integrity:*
- All transactions logged before & after
- Price change trail (every modification)
- Discount application trail
- Payment reconciliation trail
- Stock adjustment trail
- NOTHING can be deleted (soft-delete with archive flag)

**⚙️ SYSTEM SETTINGS & CONFIGURATION**

*Company Information:*
- Business name, logo
- Address, phone, email, website
- NPWP (tax ID), business registration
- Bank details (for transfers)
- Company policies

*Tax Configuration:*
- Tax active/inactive toggle
- Tax type (flat amount or percentage)
- Tax percentage (e.g., 10%)
- Tax application rules (on services, products, both)
- Tax exemptions (if any)

*Payment Methods:*
- Configure available methods (Cash, Card, Transfer, Check, Installment)
- Active/inactive toggle per method
- Payment terms (if installment: max months, interest rate)
- Payment gateway integration (if online payment)
- Reconciliation settings

*Numbering Format:*
- Invoice prefix & numbering format
- Visit prefix & numbering format
- Billing prefix & numbering format
- POS receipt prefix & numbering format
- Prescription prefix & numbering format
- Supplier PO prefix & numbering format
- Auto-increment or manual numbering

*Hotel Rates:*
- Daily room rates (by room type)
- Package pricing (e.g., 5-night package discount)
- Add-on service pricing (grooming, extra food, medication, playtime)
- Occupancy-based discount policies
- Seasonal rates (if applicable)

*Business Hours & Policies:*

- Operating hours (daily)
- Appointment slot duration (e.g., 30 min)
- Cancellation policy (grace period)
- No-show policy (charge amount)
- Late payment policy (terms, grace period)

*Fraud Prevention Policies:*
- Discount policy (max discount % or amount)
- Stock adjustment threshold (requires approval if > qty)
- PO approval threshold (auto-approve if < amount)
- Reconciliation discrepancy tolerance (alert if > amount)
- Price change policy (max % change per request)

**👥 USER MANAGEMENT (FULL CONTROL)**
- User list (CRUD)
- Create user (name, email, phone, role, password)
- Assign role (OWNER, DOKTER, KASIR, CUSTOMER)
- Edit user (name, email, phone, role)
- Reset password (generate temporary)
- Activate/Deactivate users
- View user activity (login history, actions performed)
- Permission customization (if needed for exceptions)
- Account lockout/unlock (if too many failed logins)

**🤝 SUPPLIER MANAGEMENT**
- Supplier list (CRUD)
- Add supplier (name, contact, phone, email, address, payment terms)
- Edit supplier info
- Supplier performance tracking (on-time, quality)
- Price comparison (across suppliers for same item)
- Payment history (track if they're reliable)
- Blacklist/whitelist (prevent from ordering certain suppliers)

**💾 BACKUP & SYSTEM MAINTENANCE**
- Manual backup trigger
- Backup history (date, size, restore point)
- Automated backup status (frequency, last backup)
- System health check
  - Database integrity
  - File storage status
  - API health
  - Third-party integrations
- Recovery options (restore from backup)
- Cron jobs monitoring (cleanup, maintenance)

#### OWNER Permissions & Full Control

```
✅ OWNER CAN:
- Access ALL data (clinical, financial, operational, audit)
- Manage ALL master data (services, drugs, products, categories)
- Set pricing & discounts
- Approve/Reject all changes (price, discount, stock, supplier, reconciliation)
- Manage users (create, edit, delete, reset password)
- Configure system settings
- View all reports (clinical, financial, operational)
- View audit logs (complete trail)
- Override anything (if needed for emergency)
- Archive/Delete (with audit trail)
- Export data (for external analysis, regulatory)
- Manage backups & recovery
- Change user permissions
- View financial details
- See all supplier/payment information

✅ FULL APPROVAL AUTHORITY:
- Price changes
- Discount requests
- Stock adjustments
- Supplier additions
- Daily reconciliation
- PO approvals (if > threshold)
- User role changes
- System configuration changes

✅ OVERSIGHT RESPONSIBILITIES:
- Monitor all operations
- Detect fraud & anomalies
- Ensure compliance
- Strategic decision making
- Financial planning
- Performance analysis
- Risk management
```

---

### 3.4 CUSTOMER PORTAL

**Path:** `/portal/dashboard`  
**Purpose:** Self-Service Pet Care Management & Booking

#### Navigation (6 items)

| # | Label | Path | Icon |
|---|-------|------|------|
| 1 | Dashboard | `/portal/dashboard` | LayoutDashboard |
| 2 | My Pets | `/portal/pets` | PawPrint |
| 3 | My Visits | `/portal/visits` | Clock |
| 4 | Appointments | `/portal/appointments` | Calendar |
| 5 | Prescriptions | `/portal/prescriptions` | FileText |
| 6 | Invoices & Payments | `/portal/invoices` | Receipt |
| 7 | Hotel Bookings | `/portal/hotel-bookings` | Building2 |
| 8 | Profile | `/portal/profile` | User |

#### Dashboard Features

```
🛍️ CUSTOMER PORTAL DASHBOARD

┌─────────────────────────────────────────────────────┐
│ 👋 PERSONALIZED GREETING                            │
├─────────────────────────────────────────────────────┤
│ "Hi Sarah! Welcome back. Here's your pet care info" │
│                                                      │
│ Quick Stats:                                         │
│ • My Pets: 2 (Fluffy the Cat, Max the Dog)         │
│ • Upcoming Appointments: 1 (tomorrow at 10:00 AM)  │
│ • Pending Invoices: Rp 450,000 (1 invoice)         │
│ • Last Visit: 2 weeks ago (Max - vaccination)      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📅 MY PETS & UPCOMING APPOINTMENTS                   │
├─────────────────────────────────────────────────────┤
│ • Fluffy (Cat) - Next appointment: 5 Oct 2024      │
│ • Max (Dog) - Appointment tomorrow at 10:00 AM     │
│ [Book Appointment] button for each pet             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📋 LATEST VISITS & PRESCRIPTIONS                    │
├─────────────────────────────────────────────────────┤
│ • Max - Vaccination (2 days ago) - [View Report]   │
│ • Fluffy - Check-up (2 weeks ago) - [View Report]  │
│ • Max - Prescription: Antibiotics - [Print]        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💰 INVOICES & PAYMENTS                              │
├─────────────────────────────────────────────────────┤
│ Pending Payment:                                     │
│ • Invoice #INV-001: Rp 450,000 (due today)         │
│   [View Details] [Pay Now] [Print]                 │
│                                                      │
│ Paid Invoices (last 3):                             │
│ • Invoice #INV-000: Rp 350,000 (Paid 5 days ago)  │
│ • Invoice #INV-999: Rp 500,000 (Paid 2 weeks ago) │
└─────────────────────────────────────────────────────┘
```

**MY PETS (CRUD)**
- List my pets (name, species, breed, age, weight, photos)
- Add new pet:
  - Basic info (name, species, breed, birth date)
  - Physical info (weight, color/marking, distinguishing features)
  - Medical notes (allergies, conditions, medications)
  - Photo upload
- Edit pet info
- View pet's complete medical history:
  - All past visits (dates, diagnoses, treatments)
  - Vaccination records (dates, expiry)
  - Prescriptions
  - Weight tracking
  - Doctor notes (clinical observations)
- View pet's appointments & upcoming visits

**MY VISITS (READ-ONLY HISTORY)**
- List all visits (date, doctor, service, pet, status)
- Filter by pet, date range
- Visit details:
  - Chief complaint & diagnosis
  - Treatment provided
  - Medications/drugs prescribed
  - Doctor notes
  - Vital signs (weight, temperature, heart rate)
  - Charges for that visit
- Print visit report (PDF)
- Export visit history (to take to another vet)

**APPOINTMENTS (BOOKING & MANAGEMENT)**
- View available appointments (calendar view)
- Doctor availability (by date, time)
- Book appointment:
  - Select pet
  - Select doctor (or "any available")
  - Select date & time (from available slots)
  - Add notes (reason for visit, symptoms)
- Manage appointments:
  - View upcoming (with reminder)
  - Reschedule if needed
  - Cancel if needed
  - Get confirmation (email/SMS)
- Appointment reminders (1 day before, 1 hour before)

**PRESCRIPTIONS (VIEWING & PRINTING)**
- List all prescriptions (issued, active, completed)
- Prescription details:
  - Drug name, dosage, frequency, duration
  - Instructions
  - Prescribing doctor
  - Issued date
  - Refill information (if applicable)
- Print prescription (PDF) - for pharmacy
- Download prescription
- Request refill (if available)

**INVOICES & PAYMENTS (PAYMENT MANAGEMENT)**
- Invoice list (all, or filter by status: UNPAID, PARTIAL, PAID)
- Invoice details:
  - Date, due date
  - Services & products (breakdown)
  - Subtotal, tax, discount, total
  - Payment status
  - Payment history
- Payment processing:
  - Pay full or partial
  - Select payment method (if multiple available)
  - Payment confirmation (email receipt)
- Download invoice (PDF)
- Payment history (all past payments, dates, amounts)

**HOTEL BOOKINGS**
- View available rooms (dates, room types, daily rates)
- Create booking:
  - Select dates (check-in, check-out)
  - Select room type
  - Select pet(s)
  - Add notes (special requests, diet, medication schedule)
  - Select add-on services (grooming, extra food, playtime, medication admin)
  - View total cost
- Manage bookings:
  - View upcoming bookings
  - Modify booking (if available)
  - Cancel booking
  - View booking confirmation
- Hotel rules & cancellation policy (visible to customer)
- Daily pet care updates during stay (if KASIR/hotel staff input)

**PROFILE MANAGEMENT**
- View/Edit profile info:
  - Name, phone, email
  - Address, city, postal code
  - Alternative contact (emergency)
  - Preferences (communication method, language)
- Change password (old password + new password + confirmation)
- Notification preferences (SMS, email, push)
- Communication history (messages from clinic)

#### Customer Permissions

```
✅ CAN:
- View own pets & medical history
- Book appointments
- View invoices & pay
- View prescriptions
- Update own profile & password
- Book hotel rooms
- Cancel appointments/bookings (with policy)
- Download reports (medical, invoices)

❌ CANNOT:
- See other customers' data
- Access clinical staff dashboard
- Edit master data
- View financial reports
- Approve anything
- Access system settings
- See pricing details (only final invoice)
- Change doctor assignments
- Create users
```

---

## 4. DATA MODELS & SCHEMA

### 4.1 Core Entities (dari Prisma Schema)

| Model | Keterangan | Key Fields |
|-------|------------|-----------|
| **User** | User sistem (OWNER, DOKTER, KASIR, CUSTOMER) | name, email, phone, password, roleId, status, failedLoginAttempts, lockedUntil |
| **Role** | OWNER, DOKTER, KASIR, CUSTOMER (4 roles only) | name, description, permissions[] |
| **Permission** | Granular access control | name, description, code (unique) |
| **RolePermission** | Role-Permission mapping | roleId, permissionId |
| **Customer** | Data pelanggan | name, phone, email, address, city, postalCode, userId, status |
| **Pet** | Hewan peliharaan | customerId, name, species, breed, birthDate, weightKg, colorMarking, medicalHistoryNotes, image, status |
| **Visit** | Kunjungan klinis | visitNumber, customerId, petId, doctorId, visitDate, chiefComplaint, physicalExamNotes, diagnosis, treatmentNotes, weightKg, temperature, heartRate, status (DRAFT/COMPLETED/PAID), createdBy |
| **VisitItem** | Item dalam visit | visitId, itemType (SERVICE/DRUG), serviceId, drugId, quantity, unitPrice, subtotal, dosage, durationDays, instructions |
| **Appointment** | Appointment scheduling (NEW) | appointmentNumber, customerId, petId, doctorId, appointmentDate, time, type, status (PENDING/CONFIRMED/COMPLETED/CANCELLED/NO_SHOW), notes, createdAt |
| **DoctorSchedule** | Doctor availability (NEW) | doctorId, dayOfWeek, startTime, endTime, slotDuration, maxSlots, status |
| **Service** | Layanan klinik | name, description, category, price (set by OWNER), cost (for margin), status, changedBy, changedAt, version |
| **Drug** | Obat | name, description, unit, pricePerUnit, costPerUnit, minimumStock, supplierId, status, changedBy, changedAt, version |
| **ProductCategory** | Kategori produk | name, description, defaultMargin, status |
| **Product** | Produk retail | name, categoryId, price (set by OWNER), cost, minimumMargin, description, image, barcode, currentStock, reorderPoint, status, changedBy, changedAt, version |
| **Billing** | Billing klinik | billingNumber, customerId, petId, billingStartDate, billingEndDate, status (OPEN/COMPLETED/PAID/SETTLED), notes, createdBy |
| **BillingItem** | Item dalam billing | billingId, itemType, serviceId, drugId, productId, quantity, unitPrice, subtotal, notes |
| **Invoice** | Invoice tagihan | invoiceNumber, customerId, petId, sourceType (VISIT/BILLING/POS), sourceId, invoiceDate, dueDate, subtotal, taxAmount, discountAmount, total, paidAmount, status (UNPAID/PARTIAL/PAID), createdBy, createdAt |
| **InvoiceItem** | Item dalam invoice | invoiceId, itemName, quantity, unitPrice, subtotal, category |
| **Prescription** | Resep obat | prescriptionNumber, visitId, customerId, petId, prescriptionDate, status (ACTIVE/COMPLETED/CANCELLED) |
| **PrescriptionItem** | Item resep | prescriptionId, drugId, quantity, dosage, durationDays, instructions |
| **PosOrder** | Order POS | orderNumber, customerId, subtotal, taxAmount, discountAmount, total, paymentMethod, paymentAmount, changeAmount, status, createdBy, createdAt |
| **PosOrderItem** | Item order POS | posOrderId, productId, quantity, unitPrice, subtotal |
| **Payment** | Pembayaran | paymentNumber, payableType, payableId, paymentMethod, amount, status (PENDING/PAID/FAILED), notes, receivedBy, createdAt |
| **ServiceChangeRequest** | Approval untuk service pricing (NEW) | serviceId, requestedBy, oldPrice, newPrice, reason, status (PENDING/APPROVED/REJECTED), approvedBy, requestedAt, approvedAt |
| **DrugChangeRequest** | Approval untuk drug pricing (NEW) | drugId, requestedBy, oldPrice, newPrice, reason, status, approvedBy, requestedAt, approvedAt |
| **ProductChangeRequest** | Approval untuk product pricing (NEW) | productId, requestedBy, oldPrice, newPrice, reason, status, approvedBy, requestedAt, approvedAt |
| **DiscountLog** | Log semua discount yang di-apply (NEW) | invoiceId, appliedBy, discountAmount, discountPercent, reason, requiresApproval, approvalStatus, appliedBy, approvedBy, appliedAt, approvedAt |
| **StockAdjustmentApproval** | Approval untuk stock adjustment (NEW) | stockAdjustmentId, requestedBy, quantity, reason, status, approvedBy, requestedAt, approvedAt |
| **StockAdjustment** | Penyesuaian stok | productId, quantity, reason (INITIAL/POS_SOLD/BILLING_SOLD/DAMAGED/RETURN/OPNAME_ADJUST/OTHER), referenceId, createdBy, notes, approvalStatus, approvedAt |
| **DailyReconciliation** | Daily close reconciliation (NEW) | date, kasirId, totalPOS, totalInvoice, totalPayments, expectedCash, actualCash, cashDifference, expectedCard, actualCard, cardDifference, notes, status (PENDING/APPROVED/REJECTED), reviewedBy, reviewedAt |
| **HotelBooking** | Hotel room booking (NEW) | bookingNumber, customerId, petId, roomId, checkInDate, checkOutDate, dailyRate, totalDays, subtotal, serviceFee, discountAmount, total, status (CONFIRMED/CHECKED_IN/CHECKED_OUT/CANCELLED), notes, createdBy, createdAt |
| **HotelBookingService** | Add-on services untuk hotel stay (NEW) | bookingId, serviceType (GROOMING/EXTRA_FOOD/MEDICATION/PLAYTIME), quantity, unitPrice, subtotal, notes |
| **HotelRoom** | Ruangan hotel (NEW) | roomNumber, name, type, capacity, amenities, dailyRate, currentOccupancy, status (AVAILABLE/OCCUPIED/MAINTENANCE), createdBy, createdAt |
| **Supplier** | Supplier master data (NEW) | name, phone, email, address, city, postalCode, contactPerson, paymentTerms, specialization, status (ACTIVE/INACTIVE), verifiedBy, verifiedAt, createdBy, createdAt |
| **PurchaseOrder** | Purchase order ke supplier (NEW) | poNumber, supplierId, orderDate, requiredDate, status (PENDING/PARTIAL_RECEIVED/RECEIVED/CANCELLED), totalAmount, notes, createdBy, createdAt |
| **PurchaseOrderItem** | Item dalam PO (NEW) | poId, productId, drugId, quantity, unitPrice, receivedQuantity, receivedAt |
| **GoodsReceipt** | Goods received note (NEW) | grNumber, poId, receivedDate, createdBy, notes, createdAt |
| **AuditLog** | Log aktivitas | userId, action (CREATE/UPDATE/DELETE/ARCHIVE/PAYMENT/STATUS_CHANGE/APPROVE/REJECT), entityType, entityId, changes (JSON), ipAddress, userAgent, createdAt |
| **Notification** | Notifikasi | userId, title, message, type, isRead, readAt, createdAt |
| **Setting** | Pengaturan sistem | key (company_info/tax_config/payment_methods/numbering_format/hotel_rates), value (JSON), createdBy, updatedBy, updatedAt |

### 4.2 Enums

```
enum UserRole {
  OWNER
  DOKTER
  KASIR
  CUSTOMER
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
}

enum PetStatus {
  ACTIVE
  ARCHIVED
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum VisitStatus {
  DRAFT
  COMPLETED
  PAID
}

enum BillingStatus {
  OPEN
  COMPLETED
  PAID
  SETTLED
}

enum InvoiceStatus {
  UNPAID
  PARTIAL
  PAID
}

enum PrescriptionStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
}

enum HotelBookingStatus {
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
}

enum HotelRoomStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
}

enum ServiceCategory {
  KONSULTASI
  VAKSINASI
  GROOMING
  OPERASI
  LABORATORIUM
  XRAY
  RAWAT_INAP
  LAINNYA
}

enum DrugUnit {
  TABLET
  KAPSULA
  BOTOL
  VIAL
  AMPUL
  GRAM
  ML
  TETES
  LAINNYA
}

enum ItemType {
  SERVICE
  DRUG
  PRODUCT
}

enum SourceType {
  VISIT
  BILLING
  POS
}

enum StockReason {
  INITIAL
  POS_SOLD
  BILLING_SOLD
  DAMAGED
  RETURN
  OPNAME_ADJUST
  OTHER
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  ARCHIVE
  PAYMENT
  STATUS_CHANGE
  APPROVE
  REJECT
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PaymentMethod {
  CASH
  CARD
  TRANSFER
  CHECK
  INSTALLMENT
}

enum SupplierStatus {
  ACTIVE
  INACTIVE
  BLACKLIST
}
```

---

## 5. DATA FLOW & WORKFLOW

### 5.1 CLINICAL WORKFLOW (DOKTER → Auto-Generate Invoice)

```
STEP 1: APPOINTMENT BOOKING
├─ CUSTOMER books appointment (via portal or DOKTER creates)
├─ DOKTER availability checked
├─ APPOINTMENT record created (PENDING status)
└─ Customer notified (SMS/email)

STEP 2: APPOINTMENT EXECUTION
├─ DOKTER views today's appointment queue
├─ Mark appointment as CONFIRMED (customer confirmed attendance)
├─ CUSTOMER arrives at clinic

STEP 3: CREATE & COMPLETE VISIT
├─ DOKTER creates VISIT record (from appointment)
├─ DOKTER inputs clinical data:
│  ├─ Chief complaint
│  ├─ Physical exam notes
│  ├─ Vital signs (temp, heart rate, weight)
│  ├─ Diagnosis
│  └─ Treatment plan
├─ DOKTER adds SERVICES to visit:
│  ├─ Select from OWNER-managed services
│  ├─ Quantity & unit price populated automatically
│  └─ Cannot change prices (view-only)
├─ DOKTER adds DRUGS to visit:
│  ├─ Select from OWNER-managed drugs
│  ├─ Input dosage, duration, instructions
│  ├─ Unit price populated automatically
│  └─ Cannot change prices (view-only)
├─ DOKTER creates PRESCRIPTION (auto-linked to visit)
├─ DOKTER completes VISIT (mark status: COMPLETED)
└─ SYSTEM AUTOMATICALLY:
   ├─ Create INVOICE (sourceType: VISIT, sourceId: visitId)
   ├─ Populate invoice items (all services & drugs)
   ├─ Calculate subtotal (sum of all items)
   ├─ Apply tax (from settings)
   ├─ Set status: UNPAID
   ├─ Create APPOINTMENT record (mark COMPLETED)
   └─ Notify KASIR (new invoice pending payment)

STEP 4: KASIR PROCESSES PAYMENT
├─ KASIR receives notification (new invoice)
├─ Customer pays (cash, card, transfer, etc)
├─ KASIR records PAYMENT record
├─ Invoice status updated:
│  ├─ PARTIAL if partial payment
│  └─ PAID if full payment
└─ Customer receives receipt

STEP 5: AUDIT TRAIL
├─ All actions logged (DOKTER create visit, KASIR payment)
├─ Full change history maintained
├─ No deletion possible (soft-delete only with audit flag)
└─ All immutable for compliance
```

### 5.2 PRICING CONTROL WORKFLOW (Fraud Prevention)

```
STEP 1: INITIAL PRICING (OWNER Sets)
├─ OWNER creates SERVICE/DRUG/PRODUCT with pricing
├─ Pricing stored in master data
├─ Timestamp & version tracked
└─ All transactions use this price

STEP 2: PRICE CHANGE REQUEST (KASIR Suggests)
├─ KASIR views current prices (read-only)
├─ KASIR finds discrepancy (competitor price lower)
├─ KASIR submits price change request:
│  ├─ Current price: Rp 500k
│  ├─ Proposed price: Rp 450k
│  ├─ Reason: "Competitor selling at Rp 400k, we need to match"
│  └─ Submit (status: PENDING)
└─ SYSTEM LOGS (audit trail created)

STEP 3: OWNER REVIEWS & APPROVES
├─ OWNER views pending price changes dashboard
├─ OWNER sees KASIR's proposal with reasoning
├─ OWNER options:
│  ├─ APPROVE (price updated immediately)
│  ├─ REQUEST REVISION (send back to KASIR)
│  └─ REJECT (with notes why)
├─ Decision logged with timestamp
└─ If APPROVED:
   ├─ New price becomes effective immediately
   ├─ Old price archived (version history)
   ├─ KASIR notified
   └─ All future transactions use new price

STEP 4: ONGOING MONITORING
├─ OWNER views price change history report
├─ Daily price variance report (if unusual changes)
├─ Margin analysis (target vs actual)
├─ Anomaly alerts (prices changed outside normal range)
└─ Full transparency on who changed what & why

PREVENTION AGAINST FRAUD:
✅ KASIR cannot change prices directly
✅ All changes require OWNER approval
✅ Full audit trail (who suggested, when, why)
✅ Impact analysis (how many invoices affected)
✅ Approval chain (documented decision)
✅ Immutable history (cannot modify later)
```

### 5.3 DISCOUNT CONTROL WORKFLOW (Fraud Prevention)

```
STEP 1: APPLY DISCOUNT (KASIR Within Policy)
├─ KASIR at POS during transaction
├─ Customer asks for discount
├─ KASIR enters discount (amount or %)
├─ SYSTEM checks policy:
│  ├─ If < policy limit (e.g., Rp 1M)
│  │  └─ AUTO-APPROVE (discount applied immediately)
│  └─ If > policy limit
│     ├─ Mark as PENDING APPROVAL
│     ├─ Discount not applied yet
│     └─ Notify OWNER
└─ If approved: receipt printed, transaction closed

STEP 2: DISCOUNT LOGGING
├─ All discounts logged to DISCOUNT_LOG:
│  ├─ Invoice ID
│  ├─ KASIR who applied
│  ├─ Discount amount & percentage
│  ├─ Reason ("Loyal customer", "Bulk order", "VIP")
│  ├─ Timestamp
│  └─ Approval status
└─ IMMUTABLE (cannot modify or delete)

STEP 3: OWNER REVIEWS (Large Discounts)
├─ OWNER views pending discount approvals
├─ OWNER sees:
│  ├─ KASIR who requested
│  ├─ Discount amount (relative to invoice)
│  ├─ Reason provided
│  ├─ Customer info (check if VIP or not)
│  └─ KASIR history (discount patterns)
├─ OWNER options:
│  ├─ APPROVE (discount finalized)
│  └─ REJECT (with notes, discount reversed)
└─ Decision logged

STEP 4: FRAUD DETECTION & REPORTING
├─ Daily discount report:
│  ├─ Total discount amount (% of revenue)
│  ├─ By KASIR (who applies most discount?)
│  ├─ By customer (who gets most discount? - friends/family?)
│  ├─ By reason (legitimate vs suspicious)
│  └─ Unusual patterns (KASIR apply huge discounts to specific customers)
├─ Alerts for:
│  ├─ Total discount > 10% of revenue (warning)
│  ├─ Same KASIR apply discount > normal (check for friends)
│  ├─ Specific customer always get discount (preferential treatment)
│  └─ Discount amount not matching reason
└─ OWNER investigation tools (filter, drill-down)

PREVENTION AGAINST FRAUD:
✅ Small discounts auto-approved (no delay)
✅ Large discounts require OWNER approval
✅ All discounts logged & immutable
✅ Full transparency (who, what, why, when)
✅ Pattern analysis (detect suspicious behavior)
✅ Accountability (audit trail clear)
```

### 5.4 DAILY RECONCILIATION WORKFLOW (Financial Control)

```
STEP 1: END OF DAY - KASIR SUBMITS
├─ KASIR gather all day's transactions:
│  ├─ POS sales (total from receipt counter)
│  ├─ Invoice payments (total from payment records)
│  ├─ Discount applied (total)
│  └─ Tax collected (if applicable)
├─ KASIR count physical cash
├─ KASIR verify card/transfer payments (match to bank)
├─ KASIR submits DAILY_RECONCILIATION:
│  ├─ Expected POS: Rp 8,200,000 (auto from system)
│  ├─ Actual POS: Rp 8,200,000 (KASIR input)
│  ├─ Expected Cash: Rp 5,100,000
│  ├─ Actual Cash: Rp 5,100,000 (KASIR count)
│  ├─ Expected Card: Rp 3,100,000
│  ├─ Actual Card: Rp 3,100,000 (from CC processor)
│  ├─ Notes: "Good match, no discrepancies"
│  └─ Submit (status: PENDING)
└─ Day locked (transactions become immutable)

STEP 2: OWNER REVIEWS (Next Day)
├─ OWNER views pending reconciliations
├─ OWNER checks for:
│  ├─ No discrepancies (balanced)
│  ├─ Cash variance (actual vs expected)
│  ├─ Payment method breakdown correct
│  ├─ Discount tracked
│  └─ Notes adequate (if discrepancies)
├─ OWNER options:
│  ├─ APPROVE (day is finalized, transactions locked)
│  └─ REQUEST REVISION (if issues, send back to KASIR)
└─ Decision logged with timestamp

STEP 3: DISCREPANCY HANDLING
├─ If cash over/short (minor discrepancy Rp 50k):
│  ├─ Document the variance
│  ├─ Track pattern (normal cash handling error)
│  ├─ OWNER approves anyway
│  └─ Include in monthly variance report
├─ If major discrepancy (> Rp 500k):
│  ├─ OWNER requests revision (investigate)
│  ├─ KASIR re-count cash
│  ├─ Check POS receipts (match to system)
│  ├─ Check payment records (verify)
│  ├─ Document findings
│  └─ Resubmit with explanation
└─ If cannot reconcile:
   ├─ Escalate to OWNER for manual review
   ├─ Investigate possible theft/fraud
   ├─ Check CCTV if available
   └─ Audit trail pulled for investigation

STEP 4: HISTORICAL TRACKING
├─ All reconciliations stored (cannot delete)
├─ Monthly variance analysis:
│  ├─ Which days had discrepancies
│  ├─ Which KASIR had most variance
│  ├─ Patterns detected (if KASIR A always short by Rp 100k?)
│  └─ Corrective actions taken
└─ Compliance reporting (for auditor/regulatory)

PREVENTION AGAINST FRAUD:
✅ All transactions locked after reconciliation approval
✅ Cannot modify transactions after reconciliation
✅ Cash physically counted (not estimated)
✅ Multiple payment methods verified (card processor, bank)
✅ Full transparency (who reconciled, when, discrepancies noted)
✅ Pattern detection (suspicious recurring discrepancies)
✅ Accountability (KASIR & OWNER both accountable)
```

---

## 6. API ROUTES & SERVER ACTIONS

### 6.1 Authentication APIs

| Path | Method | Function |
|------|--------|----------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler (login, session, CSRF) |
| `/api/auth/reset-password` | POST | Reset password via token |

### 6.2 Notification APIs

| Path | Method | Function |
|------|--------|----------|
| `/api/notifications/[id]/read` | POST | Mark notification as read |
| `/api/notifications/mark-all-read` | POST | Mark all notifications as read |

### 6.3 Upload API

| Path | Method | Function |
|------|--------|----------|
| `/api/upload` | POST | Upload file (pet photos, product images, invoices, etc) |

### 6.4 Health & Maintenance

| Path | Method | Function |
|------|--------|----------|
| `/api/health` | GET | Health check endpoint |
| `/api/cron/cleanup` | GET | Cleanup job (cron) - delete old temp files, lock old reconciliations, etc |

### 6.5 Server Actions (Core Business Logic)

```
server/actions/auth.ts
├─ loginUser(email, password)
├─ logoutUser()
└─ changePassword(userId, oldPassword, newPassword)

server/actions/visits.ts (DOKTER)
├─ createVisit(appointmentId, petId, doctorId, visitData)
├─ updateVisit(visitId, visitData)
├─ addVisitService(visitId, serviceId, quantity)
├─ addVisitDrug(visitId, drugId, dosage, duration, instructions)
├─ completeVisit(visitId) ← Auto-triggers invoice generation
└─ cancelVisit(visitId, reason)

server/actions/appointments.ts (DOKTER + CUSTOMER)
├─ getAvailableSlots(doctorId, date)
├─ createAppointment(customerId, petId, doctorId, date, time, type, notes)
├─ updateAppointment(appointmentId, data)
├─ cancelAppointment(appointmentId, reason)
├─ completeAppointment(appointmentId)
├─ markNoShow(appointmentId, reason)
└─ getDoctorSchedule(doctorId)

server/actions/prescriptions.ts (DOKTER)
├─ generatePrescription(visitId) ← Auto-called when visit completed
├─ getPrescription(prescriptionId)
├─ completePrescription(prescriptionId)
└─ cancelPrescription(prescriptionId, reason)

server/actions/customers.ts (KASIR + CUSTOMER)
├─ createCustomer(name, phone, email, address, etc) - KASIR
├─ updateCustomer(customerId, data) - KASIR
├─ getCustomer(customerId)
├─ listCustomers(filters, pagination) - KASIR
├─ deactivateCustomer(customerId) - KASIR
└─ getMyProfile() - CUSTOMER

server/actions/pets.ts (KASIR + CUSTOMER)
├─ createPet(customerId, petData) - KASIR or CUSTOMER
├─ updatePet(petId, petData) - KASIR or CUSTOMER
├─ getPet(petId)
├─ listCustomerPets(customerId)
├─ uploadPetPhoto(petId, file)
└─ archivePet(petId)

server/actions/invoices.ts (KASIR)
├─ createInvoice(sourceType, sourceId) ← Auto-called from visits/billing/POS
├─ getInvoice(invoiceId)
├─ listInvoices(filters, pagination)
├─ recordPayment(invoiceId, amount, paymentMethod)
├─ recordPartialPayment(invoiceId, amount, paymentMethod)
├─ printInvoice(invoiceId)
└─ exportInvoices(filters, format)

server/actions/payments.ts (KASIR)
├─ processPayment(invoiceId, amount, paymentMethod)
├─ recordPayment(paymentNumber, invoiceId, amount, method)
├─ getPaymentHistory(invoiceId)
├─ listPayments(filters, pagination)
├─ voidPayment(paymentId, reason)
└─ printReceipt(paymentId)

server/actions/pos.ts (KASIR)
├─ getPosCart(sessionId)
├─ addToCart(sessionId, productId, quantity)
├─ removeFromCart(sessionId, productId)
├─ updateCartQuantity(sessionId, productId, quantity)
├─ applyDiscount(sessionId, discountAmount, reason) ← Approval workflow
├─ completePosTransaction(sessionId, paymentMethod, paymentAmount)
└─ cancelPosTransaction(sessionId, reason)

server/actions/stock.ts (KASIR)
├─ getInventory()
├─ adjustStock(productId, quantity, reason, notes) ← Approval workflow if > threshold
├─ getStockHistory(productId, dateRange)
├─ getStockAdjustmentRequests() - KASIR view requests
├─ approveStockAdjustment(adjustmentId) - OWNER only
├─ rejectStockAdjustment(adjustmentId, reason) - OWNER only
├─ getLowStockAlerts()
└─ recordStockOpname(products, physicalCounts)

server/actions/suppliers.ts (KASIR + OWNER)
├─ createSupplier(supplierData) - KASIR suggest, OWNER approve
├─ updateSupplier(supplierId, data) - OWNER
├─ listSuppliers(filters)
├─ getSupplierPerformance(supplierId)
├─ createPurchaseOrder(supplierId, items[]) - KASIR
├─ approvePurchaseOrder(poId) - OWNER if > threshold
├─ recordGoodsReceipt(poId, items[])
└─ getCancelledPoHistory()

server/actions/hotel.ts (KASIR + CUSTOMER)
├─ getAvailableRooms(checkInDate, checkOutDate)
├─ createHotelBooking(customerId, petId[], roomId, dates, services[]) - KASIR or CUSTOMER
├─ updateHotelBooking(bookingId, data)
├─ cancelHotelBooking(bookingId, reason)
├─ checkInHotel(bookingId)
├─ checkOutHotel(bookingId)
├─ addBookingService(bookingId, serviceType, quantity)
├─ getHotelOccupancy(dateRange)
├─ getHotelRevenue(dateRange)
└─ printHotelInvoice(bookingId)

server/actions/master-data.ts (OWNER only)
├─ createService(name, description, category, price, cost)
├─ updateService(serviceId, data)
├─ archiveService(serviceId)
├─ createDrug(name, unit, price, cost, minimumStock, supplierId)
├─ updateDrug(drugId, data)
├─ archiveDrug(drugId)
├─ createProduct(name, categoryId, price, cost, image, barcode, reorderPoint)
├─ updateProduct(productId, data)
├─ archiveProduct(productId)
├─ createCategory(name, description, defaultMargin)
├─ updateCategory(categoryId, data)
├─ getServiceChangeHistory(serviceId)
├─ getDrugChangeHistory(drugId)
└─ getProductChangeHistory(productId)

server/actions/approvals.ts (OWNER only)
├─ getPendingApprovals() - all pending requests
├─ approvePriceChange(changeRequestId, notes)
├─ rejectPriceChange(changeRequestId, notes)
├─ approveDiscount(discountId, notes)
├─ rejectDiscount(discountId, notes)
├─ approveStockAdjustment(adjustmentId, notes)
├─ rejectStockAdjustment(adjustmentId, notes)
├─ approveSupplier(supplierId, notes)
├─ rejectSupplier(supplierId, notes)
├─ approveReconciliation(reconciliationId, notes)
├─ requestReconciliationRevision(reconciliationId, notes)
└─ getApprovalHistory(filters)

server/actions/reconciliation.ts (KASIR + OWNER)
├─ submitDailyReconciliation(date, kasirData) - KASIR
├─ getPendingReconciliations() - OWNER
├─ approveReconciliation(reconciliationId) - OWNER
├─ requestReconciliationRevision(reconciliationId, notes) - OWNER
├─ getDailyReconciliation(date)
├─ getReconciliationHistory(dateRange)
└─ getReconciliationReport(dateRange)

server/actions/price-suggestions.ts (KASIR + OWNER)
├─ suggestServicePriceChange(serviceId, newPrice, reason) - KASIR
├─ suggestDrugPriceChange(drugId, newPrice, reason) - KASIR
├─ suggestProductPriceChange(productId, newPrice, reason) - KASIR
├─ getPriceChangeRequests(filters) - OWNER
├─ getPriceChangeHistory(productId, dateRange)
└─ getPriceChangeImpactAnalysis(changeRequestId) - Show # invoices affected

server/actions/reports.ts (All roles per permission)
├─ getDailyRevenueReport(date) - OWNER, KASIR, DOKTER
├─ getRevenueByMethodReport(dateRange) - OWNER, KASIR
├─ getRevenueByServiceReport(dateRange) - OWNER, KASIR
├─ getInventoryReport(dateRange) - OWNER, KASIR
├─ getInventoryTurnoverReport(dateRange) - OWNER, KASIR
├─ getSupplierPerformanceReport(dateRange) - OWNER, KASIR
├─ getReceivablesAgingReport() - OWNER, KASIR
├─ getCollectionRateReport(dateRange) - OWNER, KASIR
├─ getVisitStatisticsReport(dateRange) - OWNER, DOKTER
├─ getDiagnosisBreakdownReport(dateRange) - OWNER, DOKTER
├─ getVaccinationReport(dateRange) - OWNER, DOKTER
├─ getHotelOccupancyReport(dateRange) - OWNER, KASIR
├─ getDiscountReport(dateRange) - OWNER only
├─ getPriceChangeReport(dateRange) - OWNER only
├─ getStockAdjustmentReport(dateRange) - OWNER only
└─ All reports exportable to CSV, PDF, Excel

server/actions/audit-logs.ts (OWNER only)
├─ getAuditLogs(filters, pagination)
├─ getAuditTrailForEntity(entityType, entityId)
├─ getUserActivity(userId, dateRange)
├─ exportAuditLogs(filters, format)
├─ searchAuditLogs(keywords, filters)
└─ getAnomalyReport() - Suspicious activities

server/actions/settings.ts (OWNER only)
├─ getSettings(key) - fetch current settings
├─ updateCompanyInfo(data)
├─ updateTaxConfig(active, type, value)
├─ updatePaymentMethods(methods[])
├─ updateNumberingFormat(format[])
├─ updateHotelRates(rates[])
├─ updateFraudPreventionPolicies(policies)
├─ getSettingChangeHistory(key)
└─ revertSetting(key, version) - Revert to previous version

server/actions/users.ts (OWNER only)
├─ createUser(name, email, phone, role, password)
├─ updateUser(userId, data)
├─ updateUserRole(userId, roleId)
├─ deactivateUser(userId)
├─ reactivateUser(userId)
├─ resetPassword(userId) - Generate temporary password
├─ changePassword(userId, oldPassword, newPassword)
├─ getUserActivity(userId)
├─ lockUser(userId, duration)
├─ unlockUser(userId)
└─ getFailedLoginAttempts(userId)

server/queries/queries.ts (Fetch operations for client components)
├─ fetchUser(userId)
├─ fetchCustomer(customerId)
├─ fetchPet(petId)
├─ fetchVisit(visitId)
├─ fetchAppointment(appointmentId)
├─ fetchInvoice(invoiceId)
├─ fetchPrescription(prescriptionId)
├─ fetchService(serviceId)
├─ fetchDrug(drugId)
├─ fetchProduct(productId)
├─ fetchSupplier(supplierId)
├─ fetchHotelBooking(bookingId)
├─ fetchHotelRoom(roomId)
├─ listVisits(filters, pagination)
├─ listAppointments(filters, pagination)
├─ listInvoices(filters, pagination)
├─ listPrescriptions(filters, pagination)
├─ listServices(filters)
├─ listDrugs(filters)
├─ listProducts(filters, pagination)
├─ listSuppliers(filters)
├─ listHotelBookings(filters, pagination)
└─ getAllNotifications(userId, limit)
```

---

## 7. FITUR LINTAS SISTEM

### 7.1 Autentikasi & Keamanan

- **NextAuth Credentials Provider** — Login via email & password
- **JWT Strategy** — Session max 12 jam
- **Rate Limiting**:
  - 10 request/15 menit untuk auth
  - 10 request/menit untuk upload
  - 100 request/menit untuk API umum
- **Account Lockout** — 5 percobaan login gagal → akun terkunci 30 menit
- **Password Hashing** — bcrypt (12 rounds)
- **Role-based Redirect** — Login → CUSTOMER ke `/portal/dashboard`, lainnya ke `/dashboard`
- **Session Expiry** — Auto-logout setelah 12 jam
- **IP Tracking** — All actions logged dengan IP address
- **Two-Factor Authentication (Optional Future)** — SMS/TOTP untuk enhanced security

### 7.2 Navigasi & UI

- **Sidebar Collapsible** — Internal dashboards (OWNER, DOKTER, KASIR)
- **Mobile Navigation** — Hamburger menu, responsive design
- **Theme Toggle** — Dark/light mode tersedia
- **Notification Bell** — Real-time alerts di navbar
- **Role-Based Sidebar** — Different menu items per role
- **Responsive Design** — Grid responsif (1/2/3/4 kolom)
- **Loading States** — Skeleton loading untuk semua halaman
- **Empty States** — Placeholder kosong dengan ikon dan pesan
- **Status Badges** — Badge berwarna untuk setiap status
- **Breadcrumbs** — Navigation context
- **Search Bars** — Quick search untuk navigasi

### 7.3 Data Tables

- **Server-side Pagination** — 20 item per halaman (configurable)
- **Search** — Full-text search pada daftar (name, email, ID)
- **Filter** — Multi-filter (status, date range, kategori)
- **Sort** — Click column header untuk sort ascending/descending
- **Column Actions** — Edit, delete, view detail buttons per row
- **Bulk Actions** — Select multiple, bulk delete/archive
- **Export** — Export ke CSV/PDF/Excel
- **Column Customization** — Show/hide columns (future enhancement)

### 7.4 Cetak/PDF

- **Visit Report** — `/visits/[id]/print` (medical details)
- **Invoice** — `/invoices/[id]/print` (payment details, terms)
- **Prescription** — `/prescriptions/[id]/print` (drugs, dosage, instructions)
- **POS Receipt** — Dialog receipt dengan print button
- **Hotel Invoice** — Hotel charges breakdown
- **Reports** — All reports printable & exportable

### 7.5 Caching & Performance

- **Dashboard Stats** — Cached 15 detik (KPI data)
- **Chart Data** — Cached 30 detik (historical data)
- **Master Data** — Cached 5 menit (services, drugs, products)
- **Server-side Cache** — Fungsi `cached()` dari `server/lib/cache.ts`
- **Query Optimization** — Indexed fields untuk fast lookup
- **Lazy Loading** — Components load on-demand

### 7.6 Audit Trail & Compliance

- **Immutable Audit Log** — All actions logged, cannot be deleted
- **Change History** — Every field change tracked (old → new)
- **Timestamp** — All records have createdAt, updatedAt
- **User Tracking** — Who did it, when, from where (IP)
- **Soft Deletes** — Archive flag, not hard delete (for compliance)
- **Export Compliance** — Full audit trail exportable for auditors
- **Access Logs** — Track who accessed what data & when
- **Failed Attempts** — Login failures, permission denied attempts tracked

---

## 8. NEW FEATURES (Beyond Original PRD)

### 8.1 Appointment & Scheduling System

- Doctor availability management
- Customer booking portal
- Appointment reminders (SMS/email)
- Doctor schedule optimization
- No-show tracking
- Rescheduling capability
- Calendar integration

### 8.2 Pet Hotel & Boarding

- Room management (availability, rates, amenities)
- Booking system (check-in/out, duration)
- Daily rate calculation
- Add-on services (grooming, medication, playtime, extra food)
- Pet care notes (daily observations)
- Occupancy reporting
- Revenue tracking per room type

### 8.3 Supplier Management

- Supplier master data (CRUD, contact, payment terms)
- Purchase order creation & tracking
- Goods receipt notes (GRN)
- Automatic stock update on receipt
- Supplier performance metrics
- Cost comparison across suppliers
- Order history & analytics

### 8.4 Fraud Prevention & Controls

- Master data ownership (OWNER only)
- Price change approval workflow
- Discount tracking & approval workflow (large discounts)
- Daily reconciliation & OWNER review
- Stock adjustment approval (variance > threshold)
- Supplier verification & approval
- Audit trail (immutable, complete)
- Anomaly detection & alerts
- User activity monitoring
- Policy enforcement (discount limits, payment terms, etc)

### 8.5 Advanced Reporting

- Executive KPI dashboard
- Financial analytics (revenue trends, margins, collections)
- Operational analytics (visit patterns, service mix, inventory)
- Supplier performance reports
- Hotel occupancy & revenue analytics
- Discount tracking & analysis
- Staff productivity metrics
- Customer acquisition & retention
- All reports exportable (PDF, CSV, Excel, SQL)

---

## 9. IMPLEMENTATION PRIORITIES

### PHASE 1: RESTRUCTURE (Week 1-2)

```
CRITICAL - Immediate Implementation:
├─ [ ] Remove ADMIN role from system entirely
├─ [ ] Migrate ADMIN permissions to KASIR/OWNER
├─ [ ] Update role & permission matrix (4 roles only)
├─ [ ] Update middleware (route access control)
├─ [ ] Remove ADMIN from seed.ts
├─ [ ] Create migration (delete admin role records)
├─ [ ] Test all route access controls
├─ [ ] Update navigation menus (per role)
├─ [ ] Update permission checks in API
└─ [ ] All 4 roles tested end-to-end
```

### PHASE 2: FRAUD PREVENTION (Week 3-4)

```
HIGH PRIORITY - Master Data Control:
├─ [ ] Move master data CRUD to OWNER only
├─ [ ] Remove KASIR edit permissions (keep view)
├─ [ ] Add ServiceChangeRequest, DrugChangeRequest, ProductChangeRequest models
├─ [ ] Add DiscountLog model
├─ [ ] Add StockAdjustmentApproval model
├─ [ ] Add DailyReconciliation model
├─ [ ] Create approval workflow UI (for OWNER)
├─ [ ] Add change history tracking (all fields)
├─ [ ] Create audit log system (immutable)
├─ [ ] Add price change history visualization
├─ [ ] Test KASIR cannot edit master data
├─ [ ] Test approval workflow end-to-end
└─ [ ] All audit trails working correctly
```

### PHASE 3: NEW FEATURES (Week 5-7)

```
HIGH PRIORITY - Core Features:
├─ [ ] Appointment & Scheduling (DoctorSchedule, Appointment models)
├─ [ ] Pet Hotel/Boarding (HotelBooking, HotelRoom, HotelService models)
├─ [ ] Supplier Management (Supplier, PurchaseOrder, GoodsReceipt models)
├─ [ ] Daily Reconciliation workflow (KASIR submit → OWNER approve)
├─ [ ] Stock Adjustment approval workflow
├─ [ ] Discount approval workflow (large discounts)

MEDIUM PRIORITY - Supporting:
├─ [ ] Doctor Schedule Management
├─ [ ] Appointment Calendar (customer portal booking)
├─ [ ] Hotel Room Management
├─ [ ] Supplier PO creation & tracking
└─ [ ] Stock adjustment approval UI
```

### PHASE 4: REPORTING & POLISH (Week 8-9)

```
MEDIUM PRIORITY - Analytics:
├─ [ ] Executive KPI dashboard
├─ [ ] Financial reports (all types)
├─ [ ] Operational reports (all types)
├─ [ ] Supplier performance reports
├─ [ ] Hotel analytics
├─ [ ] Anomaly detection & alerts
├─ [ ] Discount analysis & trends
├─ [ ] Price change impact analysis

LOW PRIORITY - Polish:
├─ [ ] Performance optimization
├─ [ ] Mobile responsiveness enhancements
├─ [ ] Email notifications (reminders, confirmations)
├─ [ ] SMS notifications (optional)
├─ [ ] Documentation for users
└─ [ ] Training materials
```

---

## 10. TESTING CHECKLIST

### Unit Tests

```
✓ Permission checks (RBAC enforcement)
✓ Price change approval workflow
✓ Discount tracking & limits
✓ Stock adjustment approval
✓ Daily reconciliation logic
✓ Invoice generation (from visit)
✓ Payment processing (full & partial)
✓ Appointment scheduling logic
✓ Hotel booking calculation
✓ Supplier order creation
✓ Audit log completeness
```

### Integration Tests

```
✓ End-to-end visit workflow (DOKTER → Invoice → KASIR → Payment)
✓ Price change workflow (KASIR suggest → OWNER approve)
✓ Discount workflow (KASIR apply → auto/manual approval)
✓ Daily reconciliation (KASIR submit → OWNER review)
✓ Stock adjustment (KASIR request → OWNER approve)
✓ Appointment booking (CUSTOMER → DOKTER → payment)
✓ Hotel booking (CUSTOMER → KASIR process → invoicing)
✓ Supplier order (KASIR PO → receive → stock update)
✓ All roles' data access (no unauthorized access)
✓ Audit trails (all actions logged completely)
```

### Security Tests

```
✓ KASIR cannot edit master data (tested directly accessing API)
✓ DOKTER cannot access financial data
✓ CUSTOMER cannot see other customer's data
✓ ADMIN role completely removed
✓ Unauthorized role cannot access restricted routes
✓ OWNER can override anything
✓ All password hashing working (bcrypt)
✓ Session timeouts working (12 hours)
✓ Rate limiting working (auth, upload, API)
✓ Account lockout working (5 attempts → 30 min lock)
✓ Failed login attempts tracked
✓ Audit log immutable (cannot modify/delete)
✓ Soft deletes working (archive flag, not hard delete)
```

### Fraud Prevention Tests

```
✓ KASIR cannot change prices directly
✓ Price change requires OWNER approval
✓ All price changes logged (who, when, old→new)
✓ Discount > threshold requires OWNER approval
✓ All discounts logged & immutable
✓ Discount report shows patterns (by KASIR, by customer)
✓ Stock adjustment > threshold requires approval
✓ Daily reconciliation locks transactions
✓ Cannot modify locked transactions
✓ Reconciliation discrepancies flagged
✓ Anomaly detection working (unusual patterns alert OWNER)
✓ Full audit trail (cannot delete, modify, or hide)
✓ User activity logged (who logged in, what they did)
```

### UI/UX Tests

```
✓ DOKTER sees only clinical data (no financial)
✓ KASIR sees financial & operational (no clinical details)
✓ OWNER sees everything + approval alerts
✓ CUSTOMER sees only own data
✓ Navigation menus correct per role
✓ Sidebar collapsible working
✓ Mobile responsive (all screen sizes)
✓ Dark/light mode toggle working
✓ Loading states showing skeleton
✓ Empty states with proper messaging
✓ Status badges colored correctly
✓ Notifications displaying correctly
✓ Search & filter working
✓ Export buttons working
✓ Print buttons working
```

---

## 11. DEPLOYMENT CHECKLIST

```
BEFORE GOING LIVE:
├─ [ ] Database backed up
├─ [ ] All migrations tested on staging
├─ [ ] All tests passing (unit, integration, security)
├─ [ ] Security audit completed
├─ [ ] Performance testing done (load test)
├─ [ ] Audit logs verified (completeness)
├─ [ ] All role permissions verified
├─ [ ] Documentation completed
├─ [ ] User training completed
├─ [ ] Rollback plan documented
├─ [ ] Monitoring setup (error tracking, performance)
├─ [ ] Backup & recovery tested
├─ [ ] Legal/compliance review done
└─ [ ] Go-live approval from OWNER

POST-DEPLOYMENT:
├─ [ ] Monitor for errors (first 24 hours)
├─ [ ] Check performance metrics
├─ [ ] Verify all audit logs working
├─ [ ] Spot-check approval workflows
├─ [ ] Confirm users can access correct data
├─ [ ] Test edge cases (large transactions, many items)
└─ [ ] Gather feedback from users
```

---

## 12. GLOSSARY & DEFINITIONS

```
ROLES:
- OWNER: Pemilik klinik, full control, approval authority
- DOKTER: Dokter hewan, clinical operations only
- KASIR: Kasir, finance & operations, no pricing control
- CUSTOMER: Pelanggan, self-service portal only

KEY CONCEPTS:
- Master Data: Services, Drugs, Products, Categories (OWNER controlled)
- Pricing Control: Only OWNER can set prices (fraud prevention)
- Approval Workflow: Suggestion → Review → Approval (immutable audit trail)
- Audit Trail: Complete log of all actions (who, what, when, why, how)
- Soft Delete: Archive flag, not hard delete (compliance)
- Reconciliation: Daily close process (cash count, payment verification)
- Immutable: Cannot modify or delete once locked (compliance, audit)
- Fraud Prevention: Multi-layered controls (approval, audit, anomaly detection)

ABBREVIATIONS:
- OWNER: O
- DOKTER: D
- KASIR: K
- CUSTOMER: C
- RBAC: Role-Based Access Control
- JWT: JSON Web Token
- ORM: Object-Relational Mapping
- POS: Point of Sale
- CSV: Comma-Separated Values
- PDF: Portable Document Format
- SMS: Short Message Service
- IP: Internet Protocol
- API: Application Programming Interface
- CRON: Time-based job scheduler
- FIFO: First-In-First-Out (inventory method)
```

---

## 13. NOTES & FUTURE ENHANCEMENTS

### Currently Out of Scope (But Planned)

```
├─ Two-Factor Authentication (2FA)
├─ Single Sign-On (SSO) integration
├─ Multi-language support
├─ Mobile app (iOS/Android)
├─ Payment gateway integration (online payments)
├─ SMS notifications (implementation ready, feature flag)
├─ Email notifications (implementation ready, feature flag)
├─ Advanced scheduling (multi-day treatments, follow-ups)
├─ Veterinary library (breed info, condition database)
├─ Telemedicine/Video consultation
├─ Insurance claim processing
├─ Pet food/diet recommendations
├─ Vaccination certificate generation
├─ Staff payroll management
├─ Performance analytics (staff KPIs)
├─ Customer loyalty program
├─ Online booking & payment portal
├─ CRM features (customer retention)
├─ API for third-party integrations
├─ Advanced data analytics (predictive models)
└─ Multi-branch support (chain management)
```

### Known Limitations

```
├─ Single timezone support (not multi-timezone)
├─ Currency support (IDR only, but framework supports multi-currency)
├─ Backup interval (daily, not real-time sync)
├─ Concurrent user limit (tested up to 100 concurrent)
├─ File upload size (100MB max per file)
├─ Historical data retention (keeps all, no archival)
├─ No soft-delete for audit logs (permanent immutable record)
└─ Email delivery (depends on SMTP configuration)
```

### Performance Targets

```
├─ Page load time: < 3 seconds (after login)
├─ Search response: < 1 second (for 10k+ records)
├─ Report generation: < 10 seconds (full month)
├─ API response: < 500ms (95th percentile)
├─ Database query: < 100ms (average)
├─ Concurrent users: 100+ without degradation
└─ Uptime: 99.5% (excluding scheduled maintenance)
```

---

**END OF PRD**

**Document Authority:** This PRD is the source of truth untuk pengembangan PetCare. Semua keputusan teknis, feature scope, dan prioritas berdasarkan dokumen ini. Perubahan harus didiskusikan dan di-update di PRD ini sebelum implementasi.

**Last Reviewed:** July 2026  
**Next Review:** Monthly atau saat ada major feature addition
