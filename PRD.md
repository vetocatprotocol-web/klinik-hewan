# HALAND PETCARE - PRODUCT REQUIREMENTS DOCUMENT

**Version:** 3.0
**Date:** 2026-07-25
**Status:** Production Specification — Single Source of Truth
**Architecture:** Next.js Full Stack
**Revision:** Merged from PRD v2.0 + PRD-FITUR-DASHBOARD v2.0. 4-role system (ADMIN removed). Fraud prevention, appointment scheduling, pet hotel, supplier management, and daily reconciliation integrated.

---

## 1. PRODUCT VISION

Haland PetCare is a production-ready veterinary clinic platform that centralizes customer management, pet care, medical records, billing, POS, inventory, hotel, supplier, and reporting into a single application. The system serves four user roles: Owner (OWNER), Doctor (DOKTER), Cashier (KASIR), and Customer (CUSTOMER), each with distinct interfaces and permissions. The platform prioritizes simplicity, maintainability, predictable behavior across all workflows, and fraud prevention through separation of duties.

---

## 2. PRODUCT GOALS

- Single application, single database, single repository
- Zero complex configuration setup
- Clear role and permission separation (4 roles, no overlap)
- Fraud prevention via approval workflows and audit trails
- Automated billing and pricing
- Intuitive customer portal with self-service booking
- Minimal dependencies, maximum stability
- Clone-and-run local development
- One-command deployment to Vercel with Supabase

---

## 3. ENGINEERING PHILOSOPHY

- Server-first rendering with React Server Components
- Type safety at every layer (TypeScript strict, Zod validation, Prisma schema)
- Convention over configuration throughout the stack
- Feature-based architecture with domain-driven organization
- High cohesion within modules, low coupling between modules
- Zero boilerplate through reusable patterns and shared utilities
- Minimal runtime complexity
- Minimal environment variables
- Maximum readability and predictability

---

## 4. DESIGN PRINCIPLES

```
1. CLEAR SEPARATION OF DUTIES
   ├── Each role has specific responsibilities, no overlap
   ├── Data interconnected in a single integrated system
   ├── No workflow conflicts or duplicate responsibilities
   └── Complete audit trail for all actions

2. FRAUD PREVENTION & GOVERNANCE
   ├── OWNER has full control (master data, pricing, approvals)
   ├── KASIR executes transactions (cannot modify pricing/policies)
   ├── DOKTER focuses on clinical (no financial access)
   ├── CUSTOMER self-service (data isolation)
   └── Approval workflow for critical changes

3. SINGLE SOURCE OF TRUTH
   ├── Each data entity stored once (no duplication)
   ├── All changes tracked & timestamped
   ├── Full audit trail immutable
   └── Historical data preserved for compliance
```

---

## 5. TECHNOLOGY STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router |
| Rendering | React Server Components, Server Actions, Route Handlers |
| Language | TypeScript (Strict) |
| Database | PostgreSQL 14+ |
| ORM | Prisma |
| Authentication | Auth.js (NextAuth.js) — JWT strategy |
| Storage | Supabase Storage |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Validation | Zod |
| Data Fetching | TanStack Query (client), Server Components (server) |
| Email | Resend |
| Package Manager | pnpm |
| Unit Testing | Vitest |
| E2E Testing | Playwright |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

No additional technologies beyond this list are permitted without explicit justification and approval.

---

## 6. SCOPE

### In Scope

- Customer Management (registration, profiles, pet data)
- Pet Management (CRUD, medical history notes)
- Appointment Scheduling (doctor availability, customer booking, reminders)
- Visit Workflow (create, complete, auto-invoice)
- Medical Records (visit notes, diagnosis, treatment)
- Service Management (tindakan, pricing — OWNER only)
- Drug Management (obat, pricing, units — OWNER only)
- Product Management (retail products, categories, stock — OWNER only)
- Billing Module (perawatan bertahap: rawat inap)
- Pet Hotel & Boarding (room management, booking, add-on services)
- Supplier Management (supplier master, purchase orders, goods receipt)
- POS Module (retail sales)
- Payment Processing (multiple methods, invoice settlement)
- Invoice Generation and PDF export
- Prescription Generation and PDF export
- Stock Management (tracking, adjustment, reorder alerts)
- Fraud Prevention (price change approval, discount tracking, stock adjustment approval)
- Daily Reconciliation (end-of-day close, OWNER review)
- Reporting (daily sales, visits, inventory, revenue, customers, payments, hotel, supplier)
- Customer Portal (history, records, invoices, prescriptions, hotel bookings, profile)
- Owner Dashboard (KPIs, approvals, master data, user management, settings)
- Role-based access control (OWNER, DOKTER, KASIR, CUSTOMER)
- Audit trail for transactions and master data changes
- Email notifications (visit completion, invoice, payment confirmation, low stock)
- In-app notifications (simple read/unread)
- Auto-numbering for invoices, receipts, prescriptions, visits, billings, appointments, POs
- Tax calculation (flat or percentage)
- Discount management (per-transaction with approval workflow)
- Responsive design (mobile-first for customer portal)
- Dark mode toggle

### Out of Scope

- SMS/WhatsApp integration (email only)
- Multi-location/multi-branch support
- Advanced analytics/BI tools
- Video consultation
- Insurance claim processing
- AI-powered diagnostics
- Real-time inventory sync with multiple warehouses
- Loyalty program/membership system
- Advanced medical imaging/DICOM
- Payment gateway integration (architecture ready for future)
- Two-Factor Authentication (planned future)
- Mobile app (iOS/Android)
- Multi-language support
- Staff payroll management
- Single Sign-On (SSO) integration
- Advanced scheduling (multi-day treatments, follow-ups)
- Veterinary library (breed info, condition database)
- Pet food/diet recommendations
- Vaccination certificate generation
- Performance analytics (staff KPIs)
- Online booking & payment portal (separate from customer portal)
- CRM features (customer retention)
- API for third-party integrations
- Advanced data analytics (predictive models)

---

## 7. USER ROLES

### 7.1 Role Definitions (4 ROLES ONLY)

| Role | Access Level | Description |
|---|---|---|
| OWNER | Full access | Oversight, approval, master data, settings, all reports, user management |
| Doctor (DOKTER) | Medical operations | Create/read visits, input diagnosis, prescribe drugs, manage appointments. Cannot modify prices or access financial data |
| Cashier (KASIR) | Finance & operations | Process payments, create POS orders, manage inventory/hotel/suppliers, daily reconciliation. Cannot modify master data or pricing |
| Customer (CUSTOMER) | Portal access | Self-service: manage pets, book appointments, view invoices, hotel bookings. Data isolation enforced |

**Minimum Requirements:**
- At least 1 Owner account per clinic
- Multiple Doctors allowed
- Multiple Cashiers allowed
- No Admin role (removed — permissions distributed to OWNER and KASIR)

### 7.2 Permission Matrix (Source of Truth)

```
┌──────────────────────────────┬────────┬───────┬──────┬──────────┐
│ Permission                   │ OWNER  │ KASIR │ DOK  │ CUSTOMER │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ VIEW_DASHBOARD               │   ✅   │  ✅   │  ✅  │    ✅    │
├──────────────────────────────┼────────┼───────┼──────┼──────────┤
│ CLINICAL - DOKTER ONLY       │        │       │      │          │
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

✅ = Full Access (Create, Read, Update, Delete)
🔍 = Read Only / View Only (limited reports only)
❌ = No Access
✅* = Limited by policy/threshold (e.g., discount < Rp 1M)
```

### 7.3 Route Access Control

```typescript
const ROLE_ROUTES: Record<UserRole, string[]> = {
  OWNER: [],  // Full access to all routes

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
```

---

## 8. FUNCTIONAL REQUIREMENTS

### 8.1 Authentication and Authorization

#### 8.1.1 Login System
- Email-based login using Auth.js (JWT strategy)
- Password hashing via bcrypt (12 rounds)
- Password reset via email link (Resend)
- Session-based authentication via Auth.js
- Remember-me checkbox (optional)
- Maximum 5 failed login attempts triggers 30-minute account lockout
- Password minimum 8 characters, must include uppercase, lowercase, and number
- Session timeout: 12 hours of inactivity
- Customer portal uses separate auth route
- Role-based redirect: CUSTOMER → `/portal/dashboard`, others → `/dashboard`

#### 8.1.2 Authorization Enforcement
- Middleware-based route protection per role
- Server-side validation in every Server Action
- Client-side UI adaptation based on role (hide unauthorized elements)
- Audit log for all authorization failures
- IP tracking on all actions

### 8.2 Customer Management

#### 8.2.1 Customer Registration
- Staff (KASIR or DOKTER) creates customer during walk-in
- Required fields: name, phone (unique), address
- Optional fields: email (recommended for portal access), city, postal code
- System auto-generates user account with temporary password sent via email
- Customer status defaults to ACTIVE
- Duplicate check based on exact name + phone combination
- Customers cannot self-register

#### 8.2.2 Customer Profile
- View and edit: name, phone, email, address, city, postal code
- View all associated pets
- View visit history
- View invoices and payment history
- View payment reliability (on-time vs late payer history)

#### 8.2.3 Pet Management
- One customer may have multiple pets
- Pet fields: name, species (select: dog, cat, bird, rabbit, hamster, other), breed, birth date or estimated age, weight (kg), color/marking, medical history notes (owner-provided, not formal medical records), image
- Pets cannot be permanently deleted (soft delete only, status = ARCHIVED)
- Medical history notes are owner-provided information, not clinical records
- Staff (OWNER/DOKTER/KASIR) can manage pets for any customer
- Portal CUSTOMER users can only manage pets linked to their own customer record

### 8.3 Appointment & Scheduling

#### 8.3.1 Doctor Availability
- OWNER/DOKTER manages doctor schedules (day of week, start/end time, slot duration, max slots)
- Schedule stored in DoctorSchedule model
- DOKTER can manage own availability
- Doctor schedule optimization (maximize slot utilization)

#### 8.3.2 Appointment Booking
- CUSTOMER books via portal: select pet, doctor (or "any available"), date & time from available slots, add notes
- DOKTER can also create appointments for walk-ins
- Appointment status flow: PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW
- Appointment number auto-generated: APT-YYYY-MMDD-XXXXX
- Reminders sent (1 day before, 1 hour before)

#### 8.3.3 Appointment to Visit Flow
- DOKTER views today's appointment queue
- Mark appointment as CONFIRMED (customer confirmed attendance)
- Create VISIT from appointment (pre-populated customer, pet, doctor)
- On visit completion, appointment marked COMPLETED

### 8.4 Visit Workflow

#### 8.4.1 Visit Creation
1. DOKTER searches and selects customer (or starts from appointment)
2. DOKTER selects pet from customer's pet list
3. DOKTER inputs: visit date/time, chief complaint, physical exam notes (optional), diagnosis, treatment notes
4. DOKTER records vital signs (optional): weight, temperature, heart rate
5. DOKTER selects services from master list (multiple, with fixed prices — read-only)
6. DOKTER selects drugs from master list (multiple, with quantity, fixed prices — read-only)
7. System calculates subtotal from all selected items
8. Visit status = DRAFT

#### 8.4.2 Visit Completion
1. DOKTER clicks "Complete Visit"
2. System auto-generates invoice from visit items (sourceType: VISIT)
3. System auto-generates prescription from drug items
4. Visit status = COMPLETED
5. Invoice number generated: INV-YYYY-MMDD-XXXXX
6. Prescription number generated: RX-YYYY-MMDD-XXXXX
7. Invoice status = UNPAID
8. KASIR notified of new pending invoice

#### 8.4.3 Visit Payment
1. KASIR receives payment through POS module or invoice payment
2. Payment amount must be >= invoice total
3. Full payment: Invoice status = PAID, Visit status = PAID
4. Partial payment: Invoice status = PARTIAL, payment recorded
5. Change calculated automatically for cash payments

#### 8.4.4 Business Rules
- Visits cannot be deleted (only editable while DRAFT)
- Every visit must reference a valid pet
- Diagnosis and treatment must have at least 1 entry
- Prices are captured from master data at time of visit creation (immutable for historical records)
- DOKTER cannot modify service/drug prices
- DOKTER can view pet history and export visit notes as PDF
- Medical records are immutable (audit trail)

### 8.5 Billing Module (Perawatan Bertahap)

#### 8.5.1 Workflow
1. Staff creates billing record for customer and pet (OPEN status)
2. Billing number generated: BIL-YYYY-MMDD-XXXXX
3. Staff adds items over time: services, drugs, products
4. Each item captures fixed price at time of addition
5. Items can be added while billing status = OPEN
6. Staff completes billing (OPEN → COMPLETED)
7. Invoice auto-generated with final amount
8. Payment processed (COMPLETED → PAID/SETTLED)

#### 8.5.2 Billing Items
- item_type: SERVICE, DRUG, or PRODUCT
- Captures: item reference, quantity, unit_price (fixed at addition), subtotal
- Optional notes per item

#### 8.5.3 Business Rules
- Billing status flow: OPEN → COMPLETED → PAID/SETTLED
- Items cannot be deleted after billing is COMPLETED
- Billing can be monitored in real-time: duration, item count, running total
- Partial payment supported

### 8.6 POS Module

#### 8.6.1 Workflow
1. KASIR starts new transaction (customer selection optional)
2. KASIR searches or scans product
3. KASIR adds product with quantity
4. System calculates: subtotal, tax, total
5. KASIR optionally applies discount (flat or percentage)
   - If discount < policy limit → auto-approve
   - If discount > policy limit → mark PENDING, notify OWNER for approval
6. KASIR selects payment method and inputs amount
7. System calculates change for cash payments
8. Receipt generated: RCP-YYYY-MMDD-XXXXX
9. Transaction completes, stock deducted

#### 8.6.2 Business Rules
- POS orders cannot be edited after completion
- Stock must be available (system checks before submit)
- Payment must be >= total (no arrears for POS)
- Change calculated automatically for cash payment
- Customer selection is optional
- All POS transactions logged (audit trail)
- Cannot delete (only void with reason)

### 8.7 Payment and Invoicing

#### 8.7.1 Payment Processing
- Payments can originate from: Visit, Billing, or POS Order
- Payment record captures: payment number, source reference, method, amount, status, notes, receiver
- Payment flow: validate amount >= invoice total, record payment, update invoice status, calculate change
- Partial payments are recorded individually
- Payments cannot be deleted (OWNER can revert for extraordinary cases)

#### 8.7.2 Invoice Generation
- Invoices auto-generated when Visit or Billing is completed
- Invoice captures: customer, pet, source reference, dates, subtotal, tax, discount, total, paid amount, status
- Invoice items capture: name, quantity, unit_price, subtotal, category
- Invoice is immutable after PAID status
- Invoices can be downloaded as PDF and emailed to customers

#### 8.7.3 Prescription Generation
- Prescriptions auto-generated from visit drug items
- Prescription number: RX-YYYY-MMDD-XXXXX
- Captures: visit reference, customer, pet, date, status
- Prescription items: drug reference, quantity, dosage, duration, instructions
- Prescriptions can be exported as PDF

### 8.8 Master Data Management (OWNER Only)

#### 8.8.1 Service Management
- OWNER can create, edit, archive services
- Fields: name (unique), description, category, price, cost (for margin), status
- Categories: Konsultasi, Vaksinasi, Grooming, Operasi, Laboratorium, X-Ray, Rawat Inap, Lainnya
- Archived services hidden from selection dropdowns but remain in history
- Price changes apply only to new visits
- Change history tracked (who, when, old→new)

#### 8.8.2 Drug Management
- OWNER can create, edit, archive drugs
- Fields: name (unique), description, unit (Tablet, Kapsula, Botol, Vial, Ampul, Gram, ML, Tetes, Lainnya), price_per_unit, cost_per_unit, minimum_stock, supplier_id, status
- Unit cannot be changed after creation
- Archived drugs hidden from selection but remain in history
- Change history tracked

#### 8.8.3 Product Management
- OWNER can create, edit, archive products
- Fields: name (unique), category reference, price, cost, minimum_margin, description, image_url, barcode (optional), current_stock, reorder_point, status
- OWNER can manage product categories (CRUD with soft delete)
- Categories include: name, description, default_margin
- Archived products hidden from POS selection but remain in order history
- Change history tracked

#### 8.8.4 Stock Management
- Current stock tracked per product
- Stock decreases on POS order submission and billing item
- Stock adjustable via manual stock opname (OWNER/KASIR with approval)
- Low stock warning when current_stock < reorder_point
- Stock never goes negative (system rejects insufficient stock)
- Stock adjustment history tracked with reason, reference, and user
- Adjustment reasons: INITIAL, POS_SOLD, BILLING_SOLD, DAMAGED, RETURN, OPNAME_ADJUST, OTHER
- Adjustment > threshold requires OWNER approval

#### 8.8.5 Tax Configuration
- OWNER configures: type (flat or percentage), value, enabled/disabled
- Tax applied to all transactions
- Tax amount displayed separately on invoices

#### 8.8.6 Discount Management
- Discount applied per-transaction by KASIR
- Type: flat amount or percentage
- OWNER can set maximum discount percentage limit (policy)
- Discount < policy limit → auto-approve
- Discount > policy limit → requires OWNER approval
- All discounts logged to DiscountLog (immutable)

#### 8.8.7 Payment Method Configuration
- OWNER configures available payment methods
- Default: Cash (always active)
- Optional: Bank Transfer, Card, e-Wallet, Check, Installment, Custom
- Per method: name, status (active/inactive), instructions
- At least 1 payment method must be active (Cash)

#### 8.8.8 Company Configuration
- Fields: clinic name, logo, address, phone, email, operating hours, tax ID, NPWP, bank details, invoice footer notes, receipt footer notes
- Numbering format: invoice prefix, receipt prefix, visit prefix, billing prefix, appointment prefix, PO prefix, prescription prefix
- Hotel rates: daily room rates by type, package pricing, add-on service pricing
- Business hours, appointment slot duration, cancellation policy, late payment policy
- Fraud prevention policies: discount limit, stock adjustment threshold, PO approval threshold, reconciliation discrepancy tolerance

### 8.9 Pet Hotel & Boarding

#### 8.9.1 Room Management
- Room list: name, type, capacity, daily rate, amenities, status (AVAILABLE/OCCUPIED/MAINTENANCE)
- Occupancy tracking (current, upcoming)
- Maintenance schedule (mark room as maintenance)
- Rate management (view pricing set by OWNER)

#### 8.9.2 Booking Workflow
- Calendar view (room occupancy)
- Create booking: customer, pet(s), room, check-in/check-out dates
- Booking status flow: CONFIRMED → CHECKED_IN → CHECKED_OUT / CANCELLED
- Booking number auto-generated: HTL-YYYY-MMDD-XXXXX
- Daily rate applied automatically
- Add services: grooming, extra food, medication, playtime
- CUSTOMER can book via portal; KASIR can book at front desk

#### 8.9.3 Hotel Charges
- Auto-calculate: length of stay × daily rate + add-on services
- Generate hotel invoice (separate line item in customer invoice)
- Pet care notes (daily observations by KASIR/hotel staff)

#### 8.9.4 Business Rules
- Room cannot be double-booked for overlapping dates
- Check-in/check-out updates room occupancy
- Cancellation policy enforced
- Hotel revenue tracked in daily reconciliation

### 8.10 Supplier Management

#### 8.10.1 Supplier Master
- Supplier list (CRUD)
- Fields: name, phone, email, address, city, postal code, contact person, payment terms, specialization, status (ACTIVE/INACTIVE/BLACKLIST)
- New suppliers require OWNER verification and approval
- KASIR can suggest new suppliers; OWNER approves

#### 8.10.2 Purchase Orders
- KASIR creates PO: select supplier, items, quantities
- PO number auto-generated: PO-YYYY-MMDD-XXXXX
- PO > budget threshold → OWNER approval needed
- PO status flow: PENDING → PARTIAL_RECEIVED → RECEIVED / CANCELLED
- Track PO history

#### 8.10.3 Goods Receiving
- Record goods received (from PO)
- Mark items received (full or partial)
- Update stock automatically
- Quality check (accept/reject items)
- Generate GR note

#### 8.10.4 Supplier Performance
- On-time delivery rate (%)
- Quality score (defect/return rate)
- Price competitiveness
- Lead time average
- Relationship value (total spend)

### 8.11 Daily Reconciliation

#### 8.11.1 Close Process
- KASIR gathers all day's transactions: POS sales, invoice payments, discounts applied, tax collected
- KASIR counts physical cash
- KASIR verifies card/transfer payments (match to bank)

#### 8.11.2 Reconciliation Form
- Expected POS: [auto-calculated from transactions]
- Actual POS: [KASIR input from receipt counter]
- Expected Cash: [auto from payment methods]
- Actual Cash: [KASIR count]
- Expected Card: [auto from CC processor]
- Actual Card: [KASIR verify]
- Variance calculation (auto)
- Notes (for discrepancies)
- Submit for OWNER review

#### 8.11.3 Workflow
- KASIR submit → status PENDING
- OWNER review → can APPROVE or REQUEST REVISION
- If APPROVED → lock the day's transactions (immutable)
- If REQUEST REVISION → go back to KASIR
- Historical record kept for audit
- Discrepancy handling: minor (documented, tracked), major (investigated, escalated)

### 8.12 Fraud Prevention & Controls

#### 8.12.1 Price Change Approval
- KASIR views current prices (read-only)
- KASIR submits price change request with justification
- OWNER reviews: APPROVE / REQUEST REVISION / REJECT
- All decisions timestamped & tracked
- Impact analysis (how many invoices affected)

#### 8.12.2 Discount Tracking & Approval
- Small discounts auto-approved (within policy)
- Large discounts require OWNER approval
- All discounts logged (who, what, why, when) — immutable
- Pattern analysis (detect suspicious behavior by KASIR or per customer)

#### 8.12.3 Stock Adjustment Approval
- KASIR reports damaged/waste, physical count discrepancies
- Adjustment > threshold requires OWNER approval
- Track variance patterns (detect theft)

#### 8.12.4 Supplier Verification
- New supplier proposals from KASIR require OWNER approval
- Verify credentials, payment terms

#### 8.12.5 Anomaly Detection
- Price changes outside normal range
- Discounts unusually high
- Revenue variance from forecast
- Recurring cash discrepancies
- Alert system for suspicious patterns

### 8.13 Owner Dashboard

#### 8.13.1 Dashboard Overview
- KPI cards: monthly revenue, customer metrics, operations stats
- Critical alerts: pending approvals (price changes, discounts, stock adjustments, suppliers, reconciliation)
- Revenue trends (30 days chart)
- Financial snapshot: receivables, payables, cash balance, inventory value
- Approval workflow queue (quick action buttons)
- Recent transactions

#### 8.13.2 Approval Workflow Queue
- Price change requests: view current vs proposed, justification, approve/reject
- Discount requests: view amount, percentage, customer, reason
- Stock adjustment requests: view quantity, reason, notes
- Supplier proposals: view credentials, payment terms
- Reconciliation review: check discrepancies, approve/request revision

#### 8.13.3 User Management
- OWNER can create, edit, disable/enable users
- Fields: name, email, phone, role, status
- OWNER can reset user passwords
- OWNER can view user activity log (audit trail)
- Account lockout/unlock

### 8.14 Customer Portal

#### 8.14.1 Portal Access
- Separate route group (/portal/*)
- Customer logs in with email and password
- Mobile-responsive design (primary access device)
- Session managed by Auth.js

#### 8.14.2 Portal Features
- Dashboard: personalized greeting, quick stats, upcoming appointments, pending invoices
- My Pets: CRUD (name, species, breed, birth date, weight, color, medical notes, photo)
- My Visits: read-only history with filtering (by pet, date range)
- Medical Records: view per visit (complaint, diagnosis, treatment, drugs, vital signs)
- Appointments: view available slots, book appointment, manage (reschedule/cancel)
- Prescriptions: view details, download/print PDF
- Invoices & Payments: view list, pay full or partial, download PDF
- Hotel Bookings: view available rooms, create/manage bookings
- Profile: edit info (name, phone, email, address, city, postal code, alternative contact/emergency), change password, notification preferences, communication history

#### 8.14.3 Customer Permissions
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

### 8.15 Notifications

#### 8.15.1 Email Notifications
| Event | Recipient | Content |
|---|---|---|
| Customer registered | Owner | New customer registered |
| Visit completed | Customer | Visit summary, invoice created |
| Invoice generated | Customer | Invoice ready, download link |
| Payment received | Customer | Payment confirmed, receipt |
| Low stock | Owner | Product below reorder point |
| Daily summary | Owner | Daily report summary |
| Appointment reminder | Customer | 1 day before, 1 hour before |

Emails sent via Resend. HTML templates with clinic branding.

#### 8.15.2 In-App Notifications
- Notification bell in top navigation
- Unread count badge
- Click to view notification list
- Mark as read functionality
- Auto-dismiss after 7 days

---

## 9. DOMAIN MODEL

### 9.1 Entities

| Entity | Description |
|---|---|
| User | System user (OWNER, DOKTER, KASIR, CUSTOMER) |
| Role | Role definition (seeded, 4 roles) |
| RolePermission | Role-permission mapping (seeded) |
| Permission | Individual permission definition |
| Customer | Clinic client with pet ownership |
| Pet | Animal belonging to a customer |
| Appointment | Appointment scheduling record |
| DoctorSchedule | Doctor availability slots |
| Service | Medical procedure or treatment (master data — OWNER only) |
| Drug | Medication (master data — OWNER only) |
| Product | Retail item (master data — OWNER only) |
| ProductCategory | Product classification (master data) |
| Visit | Single clinic visit with medical notes |
| VisitItem | Service or drug line item in a visit |
| Billing | Extended care record (hospitalization) |
| BillingItem | Line item in a billing record |
| Invoice | Financial document generated from visit or billing |
| InvoiceItem | Line item in an invoice |
| Prescription | Drug prescription generated from visit |
| PrescriptionItem | Individual drug in a prescription |
| PosOrder | Retail point-of-sale transaction |
| PosOrderItem | Product line item in a POS order |
| Payment | Payment record against any payable source |
| ServiceChangeRequest | Price change approval for services |
| DrugChangeRequest | Price change approval for drugs |
| ProductChangeRequest | Price change approval for products |
| DiscountLog | Log of all discounts applied |
| StockAdjustment | Manual stock change record |
| StockAdjustmentApproval | Approval for stock adjustments |
| DailyReconciliation | Daily close reconciliation record |
| HotelBooking | Hotel room booking |
| HotelBookingService | Add-on services for hotel stay |
| HotelRoom | Hotel room definition |
| Supplier | Supplier master data |
| PurchaseOrder | Purchase order to supplier |
| PurchaseOrderItem | Item in a purchase order |
| GoodsReceipt | Goods received note |
| AuditLog | System audit trail entry |
| Notification | In-app notification |
| Setting | System configuration key-value store |

### 9.2 Entity Relationships

```
User (1) ──→ (N) Visit [created_by]
User (1) ──→ (N) Billing [created_by]
User (1) ──→ (N) StockAdjustment [created_by]
User (1) ──→ (N) Payment [received_by]
User (1) ──→ (N) AuditLog [user_id]
User (1) ──→ (N) Notification [user_id]
User (1) ──→ (N) Appointment [doctor_id]
User (1) ──→ (N) DoctorSchedule [doctor_id]
User (N) ──→ (1) Role [role_id]

Customer (1) ──→ (N) Pet [customer_id]
Customer (1) ──→ (N) Visit [customer_id]
Customer (1) ──→ (N) Billing [customer_id]
Customer (1) ──→ (N) Invoice [customer_id]
Customer (1) ──→ (N) Prescription [customer_id]
Customer (1) ──→ (N) Appointment [customer_id]
Customer (1) ──→ (N) HotelBooking [customer_id]
Customer (1) ──→ (1) User [user_id] (optional, for portal access)

Pet (N) ──→ (1) Customer [customer_id]
Pet (1) ──→ (N) Visit [pet_id]
Pet (1) ──→ (N) Billing [pet_id]
Pet (1) ──→ (N) Invoice [pet_id]
Pet (1) ──→ (N) Prescription [pet_id]
Pet (1) ──→ (N) Appointment [pet_id]
Pet (1) ──→ (N) HotelBooking [pet_id]

Service (1) ──→ (N) VisitItem [service_id]
Service (1) ──→ (N) BillingItem [service_id]

Drug (1) ──→ (N) VisitItem [drug_id]
Drug (1) ──→ (N) BillingItem [drug_id]
Drug (1) ──→ (N) PrescriptionItem [drug_id]

ProductCategory (1) ──→ (N) Product [category_id]
Product (1) ──→ (N) PosOrderItem [product_id]
Product (1) ──→ (N) BillingItem [product_id]
Product (1) ──→ (N) StockAdjustment [product_id]

Visit (1) ──→ (N) VisitItem [visit_id]
Visit (1) ──→ (1) Invoice [source_type='VISIT', source_id]
Visit (1) ──→ (1) Prescription [visit_id]

VisitItem (N) ──→ (1) Visit [visit_id]
VisitItem (N) ──→ (1) Service OR Drug [service_id OR drug_id]

Billing (1) ──→ (N) BillingItem [billing_id]
Billing (1) ──→ (1) Invoice [source_type='BILLING', source_id]

BillingItem (N) ──→ (1) Billing [billing_id]
BillingItem (N) ──→ (1) Service OR Drug OR Product

Invoice (1) ──→ (N) InvoiceItem [invoice_id]
Invoice (1) ──→ (N) Payment [payable_type='Invoice', payable_id]

InvoiceItem (N) ──→ (1) Invoice [invoice_id]

Prescription (1) ──→ (N) PrescriptionItem [prescription_id]
PrescriptionItem (N) ──→ (1) Prescription [prescription_id]
PrescriptionItem (N) ──→ (1) Drug [drug_id]

PosOrder (1) ──→ (N) PosOrderItem [pos_order_id]
PosOrderItem (N) ──→ (1) PosOrder [pos_order_id]
PosOrderItem (N) ──→ (1) Product [product_id]

Payment (N) ──→ (1) User [received_by]

HotelBooking (1) ──→ (N) HotelBookingService [booking_id]
HotelBooking (N) ──→ (1) HotelRoom [room_id]
HotelRoom (1) ──→ (N) HotelBooking [room_id]

Supplier (1) ──→ (N) PurchaseOrder [supplier_id]
PurchaseOrder (1) ──→ (N) PurchaseOrderItem [po_id]
PurchaseOrder (1) ──→ (1) GoodsReceipt [po_id]

ServiceChangeRequest (N) ──→ (1) Service [service_id]
DrugChangeRequest (N) ──→ (1) Drug [drug_id]
ProductChangeRequest (N) ──→ (1) Product [product_id]
DiscountLog (N) ──→ (1) Invoice [invoice_id]
StockAdjustmentApproval (N) ──→ (1) StockAdjustment [stockAdjustmentId]
```

### 9.3 Cascade Behaviors

| Relationship | Delete Behavior | Update Behavior |
|---|---|---|
| Customer -> Pets | CASCADE (pets deleted with customer) | Propagate |
| Customer -> Visits | RESTRICT (cannot delete customer with visits) | Propagate |
| Customer -> Billings | RESTRICT (cannot delete customer with billings) | Propagate |
| Customer -> Invoices | RESTRICT (cannot delete customer with invoices) | Propagate |
| Pet -> Visits | RESTRICT (cannot delete pet with visits) | Propagate |
| Visit -> VisitItems | CASCADE (items deleted with visit) | Propagate |
| Visit -> Invoice | RESTRICT (cannot delete visit with invoice) | Propagate |
| Billing -> BillingItems | CASCADE (items deleted with billing) | Propagate |
| Billing -> Invoice | RESTRICT (cannot delete billing with invoice) | Propagate |
| Invoice -> InvoiceItems | CASCADE (items deleted with invoice) | Propagate |
| Invoice -> Payments | RESTRICT (cannot delete invoice with payments) | Propagate |
| Prescription -> PrescriptionItems | CASCADE | Propagate |
| PosOrder -> PosOrderItems | CASCADE | Propagate |
| ProductCategory -> Products | RESTRICT (cannot delete category with products) | Propagate |
| HotelRoom -> HotelBookings | RESTRICT (cannot delete room with bookings) | Propagate |
| Supplier -> PurchaseOrders | RESTRICT (cannot delete supplier with POs) | Propagate |

---

## 10. DATABASE ARCHITECTURE

### 10.1 Database Selection
PostgreSQL 14+ via Supabase. Single database instance. No sharding. Vertical scaling only.

### 10.2 Prisma Schema — Key Models

#### User
```
Purpose: System users for all roles
Fields: name, email, phone, password, roleId, status, failedLoginAttempts, lockedUntil
Indexes: email (unique), role_id, status, phone
Lifecycle: Created by OWNER, soft-deletable (status = INACTIVE)
```

#### Customer
```
Purpose: Clinic clients
Fields: name, phone, email, address, city, postalCode, userId, status
Indexes: phone (unique), email, status, name (trigram for search)
Lifecycle: Created by staff, soft-deletable (status = INACTIVE)
```

#### Pet
```
Purpose: Animals belonging to customers
Fields: customerId, name, species, breed, birthDate, weightKg, colorMarking, medicalHistoryNotes, image, status
Indexes: customer_id, species, status, name
Lifecycle: Created by staff or customer, soft-deletable (status = ARCHIVED)
```

#### Appointment
```
Purpose: Appointment scheduling
Fields: appointmentNumber, customerId, petId, doctorId, appointmentDate, time, type, status, notes
Indexes: appointmentNumber (unique), doctorId, customerId, appointmentDate, status
Lifecycle: PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW
```

#### DoctorSchedule
```
Purpose: Doctor availability
Fields: doctorId, dayOfWeek, startTime, endTime, slotDuration, maxSlots, status
Indexes: doctorId, dayOfWeek
Lifecycle: Created by OWNER/DOKTER
```

#### Visit
```
Purpose: Single clinic visit
Fields: visitNumber, customerId, petId, doctorId, visitDate, chiefComplaint, physicalExamNotes, diagnosis, treatmentNotes, weightKg, temperature, heartRate, status, createdBy
Indexes: visitNumber (unique), customer_id, pet_id, visit_date, status, created_by
Lifecycle: DRAFT → COMPLETED → PAID. Created by DOKTER, editable only in DRAFT
```

#### VisitItem
```
Purpose: Line items (services or drugs)
Fields: visitId, itemType (SERVICE/DRUG), serviceId, drugId, quantity, unitPrice, subtotal, dosage, durationDays, instructions
Constraints: exactly one of service_id or drug_id must be set, quantity >= 1
```

#### Service
```
Purpose: Medical procedures (OWNER only)
Fields: name, description, category, price, cost, status, changedBy, changedAt, version
Constraints: name unique, price >= 0
```

#### Drug
```
Purpose: Medications (OWNER only)
Fields: name, description, unit, pricePerUnit, costPerUnit, minimumStock, supplierId, status, changedBy, changedAt, version
Constraints: name unique, unit immutable after creation
```

#### Product
```
Purpose: Retail items (OWNER only)
Fields: name, categoryId, price, cost, minimumMargin, description, image, barcode, currentStock, reorderPoint, status, changedBy, changedAt, version
Constraints: name unique, category_id required, current_stock >= 0
```

#### Billing
```
Purpose: Extended care record
Fields: billingNumber, customerId, petId, billingStartDate, billingEndDate, status (OPEN/COMPLETED/PAID/SETTLED), notes, createdBy
Constraints: billing_number unique
```

#### Invoice
```
Purpose: Financial document
Fields: invoiceNumber, customerId, petId, sourceType (VISIT/BILLING/POS), sourceId, invoiceDate, dueDate, subtotal, taxAmount, discountAmount, total, paidAmount, status (UNPAID/PARTIAL/PAID), createdBy
Constraints: invoice_number unique
```

#### Prescription
```
Purpose: Drug prescription
Fields: prescriptionNumber, visitId, customerId, petId, prescriptionDate, status (ACTIVE/COMPLETED/CANCELLED)
Constraints: prescription_number unique
```

#### PosOrder
```
Purpose: POS transaction
Fields: orderNumber, customerId, subtotal, taxAmount, discountAmount, total, paymentMethod, paymentAmount, changeAmount, status, createdBy
Constraints: order_number unique
```

#### Payment
```
Purpose: Payment records
Fields: paymentNumber, payableType, payableId, paymentMethod, amount, status (PENDING/PAID/FAILED), notes, receivedBy
Constraints: payment_number unique, amount > 0
```

#### ServiceChangeRequest / DrugChangeRequest / ProductChangeRequest
```
Purpose: Price change approval workflow
Fields: serviceId/drugId productId, requestedBy, oldPrice, newPrice, reason, status (PENDING/APPROVED/REJECTED), approvedBy, requestedAt, approvedAt
```

#### DiscountLog
```
Purpose: Immutable discount audit trail
Fields: invoiceId, appliedBy, discountAmount, discountPercent, reason, requiresApproval, approvalStatus, approvedBy, appliedAt, approvedAt
```

#### StockAdjustment
```
Purpose: Manual stock change records
Fields: productId, quantity, reason (INITIAL/POS_SOLD/BILLING_SOLD/DAMAGED/RETURN/OPNAME_ADJUST/OTHER), referenceId, createdBy, notes, approvalStatus, approvedAt
```

#### StockAdjustmentApproval
```
Purpose: Stock adjustment approval workflow
Fields: stockAdjustmentId, requestedBy, quantity, reason, status, approvedBy, requestedAt, approvedAt
```

#### DailyReconciliation
```
Purpose: Daily close reconciliation
Fields: date, kasirId, totalPOS, totalInvoice, totalPayments, expectedCash, actualCash, cashDifference, expectedCard, actualCard, cardDifference, notes, status (PENDING/APPROVED/REJECTED), reviewedBy, reviewedAt
```

#### HotelBooking
```
Purpose: Hotel room booking
Fields: bookingNumber, customerId, petId, roomId, checkInDate, checkOutDate, dailyRate, totalDays, subtotal, serviceFee, discountAmount, total, status (CONFIRMED/CHECKED_IN/CHECKED_OUT/CANCELLED), notes, createdBy, createdAt
```

#### HotelBookingService
```
Purpose: Add-on services for hotel stay
Fields: bookingId, serviceType (GROOMING/EXTRA_FOOD/MEDICATION/PLAYTIME), quantity, unitPrice, subtotal, notes
```

#### HotelRoom
```
Purpose: Hotel room
Fields: roomNumber, name, type, capacity, amenities, dailyRate, currentOccupancy, status (AVAILABLE/OCCUPIED/MAINTENANCE), createdBy
```

#### Supplier
```
Purpose: Supplier master data
Fields: name, phone, email, address, city, postalCode, contactPerson, paymentTerms, specialization, status (ACTIVE/INACTIVE/BLACKLIST), verifiedBy, verifiedAt, createdBy, createdAt
```

#### PurchaseOrder
```
Purpose: Purchase order to supplier
Fields: poNumber, supplierId, orderDate, requiredDate, status (PENDING/PARTIAL_RECEIVED/RECEIVED/CANCELLED), totalAmount, notes, createdBy, createdAt
```

#### PurchaseOrderItem
```
Purpose: Item in a PO
Fields: poId, productId, drugId, quantity, unitPrice, receivedQuantity, receivedAt
```

#### GoodsReceipt
```
Purpose: Goods received note
Fields: grNumber, poId, receivedDate, createdBy, notes, createdAt
```

#### AuditLog
```
Purpose: System audit trail (immutable)
Fields: userId, action (CREATE/UPDATE/DELETE/ARCHIVE/PAYMENT/STATUS_CHANGE/APPROVE/REJECT), entityType, entityId, changes (JSON), ipAddress, userAgent
Retention: Rolling 12-month, archived not deleted
```

#### Notification
```
Purpose: In-app notifications
Fields: userId, title, message, type, isRead, readAt, createdAt
Auto-delete after 7 days
```

#### Setting
```
Purpose: System configuration key-value store
Fields: key (unique), value (JSON), createdBy, updatedBy, updatedAt
Keys: company_info, tax_config, payment_methods, numbering_format, hotel_rates, fraud_policies
```

### 10.3 Enums

```
enum UserRole { OWNER, DOKTER, KASIR, CUSTOMER }
enum UserStatus { ACTIVE, INACTIVE }
enum CustomerStatus { ACTIVE, INACTIVE }
enum PetStatus { ACTIVE, ARCHIVED }
enum AppointmentStatus { PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW }
enum VisitStatus { DRAFT, COMPLETED, PAID }
enum BillingStatus { OPEN, COMPLETED, PAID, SETTLED }
enum InvoiceStatus { UNPAID, PARTIAL, PAID }
enum PrescriptionStatus { ACTIVE, COMPLETED, CANCELLED }
enum PaymentStatus { PENDING, PAID, FAILED }
enum HotelBookingStatus { CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED }
enum HotelRoomStatus { AVAILABLE, OCCUPIED, MAINTENANCE }
enum ServiceCategory { KONSULTASI, VAKSINASI, GROOMING, OPERASI, LABORATORIUM, XRAY, RAWAT_INAP, LAINNYA }
enum DrugUnit { TABLET, KAPSULA, BOTOL, VIAL, AMPUL, GRAM, ML, TETES, LAINNYA }
enum ItemType { SERVICE, DRUG, PRODUCT }
enum SourceType { VISIT, BILLING, POS }
enum StockReason { INITIAL, POS_SOLD, BILLING_SOLD, DAMAGED, RETURN, OPNAME_ADJUST, OTHER }
enum AuditAction { CREATE, UPDATE, DELETE, ARCHIVE, PAYMENT, STATUS_CHANGE, APPROVE, REJECT }
enum ApprovalStatus { PENDING, APPROVED, REJECTED }
enum PaymentMethod { CASH, CARD, TRANSFER, CHECK, INSTALLMENT }
enum SupplierStatus { ACTIVE, INACTIVE, BLACKLIST }
enum HotelServiceType { GROOMING, EXTRA_FOOD, MEDICATION, PLAYTIME }
```

---

## 11. DATA FLOW & WORKFLOWS

### 11.1 Clinical Workflow (DOKTER → Auto-Generate Invoice)

```
STEP 1: APPOINTMENT BOOKING
├─ CUSTOMER books appointment (via portal) or DOKTER creates (walk-in)
├─ DOKTER availability checked
├─ APPOINTMENT record created (PENDING status)
└─ Customer notified (email)

STEP 2: APPOINTMENT EXECUTION
├─ DOKTER views today's appointment queue
├─ Mark appointment as CONFIRMED (customer confirmed attendance)
├─ CUSTOMER arrives at clinic

STEP 3: CREATE & COMPLETE VISIT
├─ DOKTER creates VISIT record (from appointment or walk-in)
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
├─ DOKTER completes VISIT (mark status: COMPLETED)
└─ SYSTEM AUTOMATICALLY:
   ├─ Create INVOICE (sourceType: VISIT, sourceId: visitId)
   ├─ Populate invoice items (all services & drugs)
   ├─ Calculate subtotal (sum of all items)
   ├─ Apply tax (from settings)
   ├─ Set status: UNPAID
   ├─ Create PRESCRIPTION (auto-linked to visit)
   ├─ Mark APPOINTMENT as COMPLETED
   └─ Notify KASIR (new invoice pending payment)

STEP 4: KASIR PROCESSES PAYMENT
├─ KASIR receives notification (new invoice)
├─ Customer pays (cash, card, transfer, etc)
├─ KASIR records PAYMENT record
├─ Invoice status updated:
│  ├─ PARTIAL if partial payment
│  └─ PAID if full payment
└─ Customer receives receipt (email)

STEP 5: AUDIT TRAIL
├─ All actions logged (DOKTER create visit, KASIR payment)
├─ Full change history maintained
├─ No deletion possible (soft-delete only with audit flag)
└─ All immutable for compliance
```

### 11.2 Pricing Control Workflow (Fraud Prevention)

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
│  ├─ Current price → Proposed price
│  ├─ Reason required
│  └─ Submit (status: PENDING)
└─ SYSTEM LOGS (audit trail created)

STEP 3: OWNER REVIEWS & APPROVES
├─ OWNER views pending price changes dashboard
├─ OWNER sees KASIR's proposal with reasoning
├─ OWNER options:
│  ├─ APPROVE (price updated immediately, logged)
│  ├─ REQUEST REVISION (send back to KASIR)
│  └─ REJECT (with notes why)
├─ Decision logged with timestamp
└─ If APPROVED:
   ├─ New price effective immediately
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

### 11.3 Discount Control Workflow (Fraud Prevention)

```
STEP 1: APPLY DISCOUNT (KASIR Within Policy)
├─ KASIR at POS during transaction
├─ Customer asks for discount
├─ KASIR enters discount (amount or %)
├─ SYSTEM checks policy:
│  ├─ If < policy limit → AUTO-APPROVE
│  └─ If > policy limit → PENDING APPROVAL, notify OWNER
└─ If approved: receipt printed, transaction closed

STEP 2: DISCOUNT LOGGING
├─ All discounts logged to DISCOUNT_LOG:
│  ├─ Invoice ID, KASIR who applied
│  ├─ Discount amount & percentage
│  ├─ Reason ("Loyal customer", "Bulk order", "VIP")
│  ├─ Timestamp, approval status
└─ IMMUTABLE (cannot modify or delete)

STEP 3: OWNER REVIEWS (Large Discounts)
├─ OWNER views pending discount approvals
├─ OWNER sees: KASIR, amount, reason, customer info
├─ OWNER options: APPROVE / REJECT
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

### 11.4 Daily Reconciliation Workflow (Financial Control)

```
STEP 1: END OF DAY - KASIR SUBMITS
├─ KASIR gathers all day's transactions:
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

## 12. UI ARCHITECTURE

### 12.1 Design System

#### Color Palette
- Primary: hsl(221, 83%, 53%) - Blue
- Secondary: hsl(142, 71%, 45%) - Green
- Destructive: hsl(0, 84%, 60%) - Red
- Warning: hsl(38, 92%, 50%) - Amber
- Muted: hsl(220, 14%, 96%) - Light Gray
- Background: hsl(0, 0%, 100%) - White
- Foreground: hsl(224, 71%, 4%) - Near Black

#### Typography
- Font: Inter (Google Fonts)
- H1: 36px/800, H2: 30px/700, H3: 24px/600, H4: 20px/600
- Body: 16px/400, Small: 14px/400, Caption: 12px/400

#### Breakpoints
- Mobile: 0-639px, Tablet: 640-1023px, Desktop: 1024px+

### 12.2 Component Library (shadcn/ui)

Button, Card, Dialog, AlertDialog, DropdownMenu, Input, Select, Textarea, Form, Label, Table, Tabs, Badge, Alert, Toast, Skeleton, Sheet, Avatar, Separator, Command, Popover, Calendar, Checkbox, RadioGroup, Switch, Tooltip, Breadcrumb, Pagination, ScrollArea

### 12.3 Layout Architecture

#### Admin/Staff Layout (OWNER, DOKTER, KASIR)
```
┌─────────────────────────────────────────────────┐
│ TOP NAVBAR                                      │
│ [Logo] [Search] [Notifications] [User Menu]     │
├──────────┬──────────────────────────────────────┤
│ SIDEBAR  │ MAIN CONTENT                         │
│ (per     │ (Server Component with Suspense)     │
│  role)   │                                      │
└──────────┴──────────────────────────────────────┘
```

#### Customer Portal Layout
```
┌─────────────────────────────────────────────────┐
│ TOP NAVBAR                                      │
│ [Logo] [Notifications] [Profile Menu]           │
├─────────────────────────────────────────────────┤
│ MAIN CONTENT (Full Width)                       │
└─────────────────────────────────────────────────┘
```

### 12.4 Responsive Behavior

| Viewport | Admin Sidebar | POS | Portal |
|---|---|---|---|
| Desktop (1024px+) | Visible, collapsible | Side-by-side | Full width |
| Tablet (640-1023px) | Collapsed to icons | Stacked | Full width |
| Mobile (<640px) | Hidden, hamburger | Stacked, full-width | Full width |

### 12.5 Cross-System UI Features

- **Sidebar Collapsible** — Internal dashboards (OWNER, DOKTER, KASIR)
- **Mobile Navigation** — Hamburger menu, responsive design
- **Theme Toggle** — Dark/light mode available
- **Notification Bell** — Real-time alerts in navbar
- **Role-Based Sidebar** — Different menu items per role
- **Responsive Design** — Grid responsif (1/2/3/4 columns)
- **Loading States** — Skeleton loading for all pages
- **Empty States** — Placeholder with icon and message
- **Status Badges** — Colored badges per status
- **Breadcrumbs** — Navigation context
- **Search Bars** — Quick search for navigation

### 12.6 Data Tables

- **Server-side Pagination** — 20 items per page (configurable)
- **Search** — Full-text search (name, email, ID)
- **Filter** — Multi-filter (status, date range, category)
- **Sort** — Click column header ascending/descending
- **Column Actions** — Edit, delete, view detail per row
- **Bulk Actions** — Select multiple, bulk delete/archive
- **Export** — Export to CSV/PDF/Excel
- **Column Customization** — Show/hide columns (future enhancement)

### 12.7 Print & PDF

- **Visit Report** — `/visits/[id]/print` (medical details)
- **Invoice** — `/invoices/[id]/print` (payment details, terms)
- **Prescription** — `/prescriptions/[id]/print` (drugs, dosage, instructions)
- **POS Receipt** — Dialog receipt with print button
- **Hotel Invoice** — Hotel charges breakdown
- **Reports** — All reports printable & exportable

---

## 13. NAVIGATION SPECIFICATION

### 13.1 OWNER Sidebar (12+ items)

| # | Label | Path |
|---|-------|------|
| 1 | Dashboard | `/dashboard` |
| 2 | Approvals | `/owner/approvals` |
| 3 | Master Data | `/owner/master` |
| 4 | Customers | `/customers` |
| 5 | Financial Reports | `/reports/financial` |
| 6 | Operational Reports | `/reports/operational` |
| 7 | Daily Reconciliation | `/reconciliation` |
| 8 | Audit Logs | `/audit-logs` |
| 9 | Suppliers | `/suppliers` |
| 10 | Settings | `/settings` |
| 11 | Users | `/settings/users` |

### 13.2 DOKTER Sidebar (5 items)

| # | Label | Path |
|---|-------|------|
| 1 | Dashboard | `/dashboard` |
| 2 | Appointments | `/appointments` |
| 3 | Visits | `/visits` |
| 4 | Patients | `/customers` |
| 5 | Prescriptions | `/prescriptions` |

### 13.3 KASIR Sidebar (9 items)

| # | Label | Path |
|---|-------|------|
| 1 | Dashboard | `/dashboard` |
| 2 | POS/Transactions | `/pos` |
| 3 | Invoices & Payments | `/invoices` |
| 4 | Receivables | `/invoices?status=UNPAID` |
| 5 | Customers | `/customers` |
| 6 | Inventory | `/stock` |
| 7 | Hotel | `/hotel` |
| 8 | Suppliers | `/suppliers` |
| 9 | Daily Close | `/reconciliation` |

### 13.4 CUSTOMER Portal Navigation (8 items)

| # | Label | Path |
|---|-------|------|
| 1 | Dashboard | `/portal/dashboard` |
| 2 | My Pets | `/portal/pets` |
| 3 | My Visits | `/portal/visits` |
| 4 | Appointments | `/portal/appointments` |
| 5 | Prescriptions | `/portal/prescriptions` |
| 6 | Invoices & Payments | `/portal/invoices` |
| 7 | Hotel Bookings | `/portal/hotel-bookings` |
| 8 | Profile | `/portal/profile` |

---

## 14. SCREEN SPECIFICATIONS

### 14.1 Login Page
- **Route:** /login
- **Layout:** Centered card on background
- **Components:** Email input, password input, remember me checkbox, submit button, forgot password link
- **Validation:** Email format, required fields
- **Success:** Redirect to role-appropriate dashboard

### 14.2 Owner Dashboard
- **Route:** /dashboard
- **Actor:** OWNER
- **Layout:** KPI stat cards row, critical alerts section, revenue trends chart, financial snapshot, approval queue, recent transactions
- **Components:** Stat cards (revenue, customers, operations), line chart (revenue 30d), alert cards (pending approvals), data table (recent transactions), approval action buttons

### 14.3 DOKTER Dashboard
- **Route:** /dashboard
- **Actor:** DOKTER
- **Layout:** Today's clinical overview, schedule & queue, alerts & action items, recent visits
- **Components:** Appointment queue, quick actions (start visit, reschedule), vaccination due alerts, recent visit cards

### 14.4 KASIR Dashboard
- **Route:** /dashboard
- **Actor:** KASIR
- **Layout:** Today's financial summary, alerts & action items, payment collection status, inventory health, hotel occupancy
- **Components:** Revenue breakdown, pending payments, receivables aging, stock health indicators, hotel occupancy stats

### 14.5 Customer Portal Dashboard
- **Route:** /portal/dashboard
- **Actor:** CUSTOMER
- **Layout:** Personalized greeting, pets & appointments, latest visits & prescriptions, invoices & payments
- **Components:** Quick stats, pet cards, visit timeline, invoice alerts

### 14.6 Customer List
- **Route:** /customers
- **Actor:** OWNER, DOKTER (view-only), KASIR (full CRUD)
- **Layout:** Toolbar + data table
- **Components:** Search input, status filter, create button, data table (name, phone, email, pets count, status, actions), pagination

### 14.7 Customer Detail
- **Route:** /customers/[id]
- **Layout:** Profile card + tabs (Pets, Visits, Invoices)

### 14.8 Customer Form (Create/Edit)
- **Route:** /customers/new, /customers/[id]/edit
- **Layout:** Single column form (name, phone, email, address, city, postal code)

### 14.9 Pet Form (Create/Edit)
- **Route:** /customers/[id]/pets/new, /pets/[id]/edit
- **Layout:** Single column form (name, species, breed, birth date, weight, color, medical notes, image)

### 14.10 Visit List
- **Route:** /visits
- **Layout:** Toolbar + data table (visit number, date, customer, pet, status, actions)

### 14.11 Visit Form (Create/Edit)
- **Route:** /visits/new, /visits/[id]/edit
- **Actor:** DOKTER
- **Layout:** Multi-section form:
  1. Customer Selection (search autocomplete)
  2. Pet Selection (dropdown, filtered by customer)
  3. Visit Info (date, time, chief complaint, diagnosis, physical exam notes, treatment notes, vital signs)
  4. Services Selection (searchable multi-select from master list, prices read-only)
  5. Drug Selection (searchable multi-select with quantity/dosage/duration from master list, prices read-only)
  6. Action buttons (Save Draft, Complete Visit)

### 14.12 Visit Detail
- **Route:** /visits/[id]
- **Layout:** Header card + sections (visit info, customer/pet info, services list, drugs list, diagnosis, treatment notes, invoice link, action buttons)

### 14.13 Appointment List
- **Route:** /appointments
- **Actor:** DOKTER, KASIR (limited), CUSTOMER (own)
- **Layout:** Calendar view + list view toggle, toolbar with date/doctor filters

### 14.14 Appointment Form
- **Route:** /appointments/new
- **Layout:** Customer/pet selection, doctor selection, date/time slot picker, appointment type, notes

### 14.15 Billing List
- **Route:** /billings
- **Layout:** Toolbar + data table (billing number, customer, pet, start date, items count, total, status, actions)

### 14.16 Billing Detail
- **Route:** /billings/[id]
- **Layout:** Header + items list + actions (add item button, items table, running total, complete button, invoice link)

### 14.17 POS Page
- **Route:** /pos
- **Actor:** KASIR
- **Layout:** Two-column (catalog left, cart right)
- **Components:** Product search, category filter tabs, product grid, cart items, subtotal/tax/discount/total, payment method select, payment amount input, discount input, pay button

### 14.18 Invoice List
- **Route:** /invoices
- **Actor:** OWNER, KASIR
- **Layout:** Toolbar + data table (invoice number, customer, date, total, paid, status, actions)

### 14.19 Invoice Detail
- **Route:** /invoices/[id]
- **Layout:** Printable invoice view (clinic header, invoice number, customer/pet info, items table, subtotal/tax/discount/total, payment history, action buttons)

### 14.20 Master Data - Services
- **Route:** /master/services or /owner/master/services
- **Actor:** OWNER
- **Layout:** Toolbar + data table + create/edit dialog

### 14.21 Master Data - Drugs
- **Route:** /master/drugs or /owner/master/drugs
- **Actor:** OWNER
- **Layout:** Toolbar + data table + create/edit dialog

### 14.22 Master Data - Products
- **Route:** /master/products or /owner/master/products
- **Actor:** OWNER
- **Layout:** Toolbar + data table + create/edit dialog

### 14.23 Stock Management
- **Route:** /stock or /master/stock
- **Actor:** KASIR (adjust with approval), OWNER (direct)
- **Layout:** Toolbar + data table (product, category, current stock, reorder point, status, adjust button)

### 14.24 Owner Approvals
- **Route:** /owner/approvals
- **Actor:** OWNER
- **Layout:** Tabbed sections (Price Changes, Discounts, Stock Adjustments, Suppliers, Reconciliation)
- **Components:** Pending items list with approve/reject buttons, approval history

### 14.25 Hotel Management
- **Route:** /hotel
- **Actor:** KASIR
- **Layout:** Calendar view (room occupancy) + booking list
- **Components:** Room cards, create booking dialog, check-in/check-out buttons

### 14.26 Supplier Management
- **Route:** /suppliers
- **Actor:** KASIR (create/PO), OWNER (approve)
- **Layout:** Toolbar + data table (supplier list, PO tracking)

### 14.27 Daily Reconciliation
- **Route:** /reconciliation
- **Actor:** KASIR (submit), OWNER (review)
- **Layout:** Reconciliation form (expected vs actual per payment method), submit/review buttons

### 14.28 User Management
- **Route:** /settings/users
- **Actor:** OWNER
- **Layout:** Toolbar + data table + create/edit dialog

### 14.29 Settings
- **Route:** /settings
- **Actor:** OWNER
- **Layout:** Tabbed sections (Company Info, Tax, Payment Methods, Numbering Format, Hotel Rates, Business Hours, Fraud Policies)

### 14.30 Reports
- **Route:** /reports
- **Actor:** OWNER, KASIR (financial), DOKTER (clinical only)
- **Layout:** Tabbed report views (Daily, Revenue, Inventory, Customers, Payments, Hotel, Supplier, Clinical)
- **Components:** Date pickers, filter selects, data tables, charts, export buttons (CSV/PDF/Excel)

### 14.31 Customer Portal - My Pets
- **Route:** /portal/pets
- **Layout:** Pet cards grid + add pet button

### 14.32 Customer Portal - Visit History
- **Route:** /portal/visits
- **Layout:** Filter bar + visit cards (date, pet, diagnosis, status)

### 14.33 Customer Portal - Appointments
- **Route:** /portal/appointments
- **Layout:** Calendar view + upcoming appointments list, booking form

### 14.34 Customer Portal - Invoices
- **Route:** /portal/invoices
- **Layout:** Invoice cards (number, date, total, status, download button)

### 14.35 Customer Portal - Prescriptions
- **Route:** /portal/prescriptions
- **Layout:** Prescription cards (number, date, drug list, download button)

### 14.36 Customer Portal - Hotel Bookings
- **Route:** /portal/hotel-bookings
- **Layout:** Available rooms, booking form, upcoming bookings list

### 14.37 Customer Portal - Profile
- **Route:** /portal/profile
- **Layout:** Profile form (name, phone, email, address, change password)

---

## 15. BACKEND ARCHITECTURE

### 15.1 Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/page.tsx
│   │   │       └── pets/
│   │   │           ├── new/page.tsx
│   │   │           └── [petId]/edit/page.tsx
│   │   ├── visits/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── appointments/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── billings/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── pos/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── prescriptions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── hotel/
│   │   │   ├── page.tsx
│   │   │   ├── rooms/page.tsx
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── po/new/page.tsx
│   │   ├── reconciliation/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── master/
│   │   │   ├── services/page.tsx
│   │   │   ├── drugs/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   └── stock/page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── financial/page.tsx
│   │   │   └── operational/page.tsx
│   │   ├── owner/
│   │   │   ├── approvals/page.tsx
│   │   │   └── master/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── users/page.tsx
│   │   ├── audit-logs/page.tsx
│   │   └── notifications/page.tsx
│   ├── (portal)/
│   │   ├── layout.tsx
│   │   ├── portal/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── pets/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── visits/page.tsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── invoices/page.tsx
│   │   │   ├── prescriptions/page.tsx
│   │   │   ├── hotel-bookings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── profile/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── upload/route.ts
│   │   ├── health/route.ts
│   │   ├── notifications/
│   │   │   ├── [id]/read/route.ts
│   │   │   └── mark-all-read/route.ts
│   │   └── cron/cleanup/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── server/
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── customers.ts
│   │   ├── pets.ts
│   │   ├── visits.ts
│   │   ├── appointments.ts
│   │   ├── prescriptions.ts
│   │   ├── billings.ts
│   │   ├── pos.ts
│   │   ├── invoices.ts
│   │   ├── payments.ts
│   │   ├── services.ts
│   │   ├── drugs.ts
│   │   ├── products.ts
│   │   ├── stock.ts
│   │   ├── suppliers.ts
│   │   ├── hotel.ts
│   │   ├── approvals.ts
│   │   ├── reconciliation.ts
│   │   ├── price-suggestions.ts
│   │   ├── reports.ts
│   │   ├── audit-logs.ts
│   │   ├── users.ts
│   │   ├── settings.ts
│   │   └── notifications.ts
│   ├── queries/
│   │   ├── customers.ts
│   │   ├── pets.ts
│   │   ├── visits.ts
│   │   ├── appointments.ts
│   │   ├── billings.ts
│   │   ├── pos.ts
│   │   ├── invoices.ts
│   │   ├── payments.ts
│   │   ├── prescriptions.ts
│   │   ├── services.ts
│   │   ├── drugs.ts
│   │   ├── products.ts
│   │   ├── stock.ts
│   │   ├── suppliers.ts
│   │   ├── hotel.ts
│   │   ├── users.ts
│   │   ├── settings.ts
│   │   ├── reports.ts
│   │   └── notifications.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── storage.ts
│   │   ├── email.ts
│   │   ├── pdf.ts
│   │   ├── numbers.ts
│   │   ├── tax.ts
│   │   ├── cache.ts
│   │   └── validators.ts
│   └── middleware.ts
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── navbar.tsx
│   │   ├── portal-navbar.tsx
│   │   └── providers.tsx
│   ├── forms/
│   │   ├── customer-form.tsx
│   │   ├── pet-form.tsx
│   │   ├── visit-form.tsx
│   │   ├── appointment-form.tsx
│   │   ├── billing-form.tsx
│   │   ├── service-form.tsx
│   │   ├── drug-form.tsx
│   │   ├── product-form.tsx
│   │   ├── stock-adjustment-form.tsx
│   │   ├── hotel-booking-form.tsx
│   │   ├── supplier-form.tsx
│   │   ├── purchase-order-form.tsx
│   │   ├── reconciliation-form.tsx
│   │   ├── user-form.tsx
│   │   ├── settings-form.tsx
│   │   └── payment-form.tsx
│   ├── data-table/
│   │   ├── data-table.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── data-table-toolbar.tsx
│   │   └── data-table-column-header.tsx
│   ├── cards/
│   │   ├── stat-card.tsx
│   │   ├── pet-card.tsx
│   │   ├── visit-card.tsx
│   │   ├── invoice-card.tsx
│   │   └── approval-card.tsx
│   ├── charts/
│   │   ├── visits-chart.tsx
│   │   ├── revenue-chart.tsx
│   │   └── occupancy-chart.tsx
│   └── shared/
│       ├── search-input.tsx
│       ├── status-badge.tsx
│       ├── confirm-dialog.tsx
│       ├── empty-state.tsx
│       ├── error-boundary.tsx
│       ├── loading-skeleton.tsx
│       └── notification-bell.tsx
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   ├── errors.ts
│   └── hooks/
│       ├── use-debounce.ts
│       ├── use-media-query.ts
│       └── use-toast.ts
├── types/
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── images/
│   └── uploads/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── vitest.config.ts
├── playwright.config.ts
└── middleware.ts
```

### 15.2 Server Actions Design

All mutations use Server Actions. Route Handlers used only for: file upload, health check, auth callbacks, and notifications.

#### Action Pattern

Every Server Action follows this structure:
1. Input: Zod-validated typed input
2. Auth check: Verify session and role
3. Business logic: Execute with Prisma transaction where needed
4. Audit log: Record the action
5. Return: Typed result with success/error

### 15.3 Server Action Reference

#### Auth Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| loginUser | email, password | Public | Max 5 attempts, 30min lockout |
| logoutUser | none | Authenticated | Clear session |
| forgotPassword | email | Public | Send reset email if account exists |
| resetPassword | token, email, password | Public | Token valid for 1h |
| changePassword | userId, oldPassword, newPassword | Authenticated | Password rules enforced |

#### Customer Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createCustomer | name, phone, email?, address?, city?, postalCode? | OWNER, DOKTER, KASIR | Phone unique, auto-create portal account |
| updateCustomer | id, fields... | OWNER, DOKTER, KASIR | Phone unique if changed |
| archiveCustomer | id | OWNER | Cannot archive with active visits |

#### Pet Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createPet | customerId, petData | OWNER, DOKTER, KASIR, CUSTOMER (own) | Customer must exist |
| updatePet | id, fields... | OWNER, DOKTER, KASIR, CUSTOMER (own) | Cannot edit archived pet |
| archivePet | id | OWNER, DOKTER, KASIR, CUSTOMER (own) | Soft delete only |

#### Appointment Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createAppointment | customerId, petId, doctorId, date, time, type, notes | OWNER, DOKTER, CUSTOMER (own) | Slot availability checked |
| updateAppointment | id, data | OWNER, DOKTER | Only PENDING/CONFIRMED |
| cancelAppointment | id, reason | OWNER, DOKTER, CUSTOMER (own) | Policy enforced |
| completeAppointment | id | DOKTER | Linked visit must exist |
| markNoShow | id, reason | DOKTER | Logged for tracking |
| getAvailableSlots | doctorId, date | Authenticated | Returns open time slots |
| getDoctorSchedule | doctorId | Authenticated | Weekly schedule |

#### Visit Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createVisit | customerId, petId, chiefComplaint, diagnosis, ...items | DOKTER | Prices from master, status DRAFT |
| updateVisit | id, fields... | DOKTER (own, DRAFT only) | Only DRAFT visits editable |
| addVisitItem | visitId, itemType, itemId, quantity | DOKTER (own, DRAFT only) | Only DRAFT |
| removeVisitItem | visitId, itemId | DOKTER (own, DRAFT only) | Only DRAFT |
| completeVisit | id | DOKTER (own, DRAFT only) | Auto-generate invoice + prescription |
| cancelVisit | id, reason | DOKTER (own, DRAFT only) | Logged for tracking |

#### Prescription Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| generatePrescription | visitId | System (auto on completeVisit) | Auto from drug items |
| getPrescription | id | OWNER, DOKTER, CUSTOMER (own) | Read-only |
| completePrescription | id | DOKTER | Status → COMPLETED |
| cancelPrescription | id, reason | DOKTER | Status → CANCELLED |

#### Billing Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createBilling | customerId, petId, notes? | OWNER, DOKTER, KASIR | Status OPEN |
| addBillingItem | billingId, itemType, itemId, quantity, notes? | OWNER, DOKTER, KASIR | Only OPEN billing |
| removeBillingItem | billingId, itemId | OWNER, DOKTER | Only OPEN billing |
| completeBilling | id | OWNER, DOKTER | Auto-generate invoice |

#### POS Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createPosOrder | customerId? | KASIR | Optional customer |
| addPosItem | orderId, productId, quantity | KASIR | Stock check required |
| removePosItem | orderId, itemId | KASIR | Before checkout only |
| applyDiscount | orderId, discountAmount, reason | KASIR | Approval workflow if > threshold |
| checkoutPos | orderId, paymentMethod, paymentAmount | KASIR | Payment >= total, stock deducted |
| cancelPosTransaction | orderId, reason | KASIR | Void with reason |

#### Invoice Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createInvoice | sourceType, sourceId | System (auto) | From visit/billing/POS |
| getInvoice | id | OWNER, KASIR, CUSTOMER (own) | Read-only |
| listInvoices | filters, pagination | OWNER, KASIR | Filterable |
| recordPartialPayment | invoiceId, amount, paymentMethod | KASIR | Amount <= remaining |
| downloadInvoicePdf | id | OWNER, KASIR, CUSTOMER (own) | Generate PDF on demand |
| printInvoice | id | OWNER, KASIR | Print view |
| emailInvoice | id | OWNER, KASIR | Send via Resend |
| exportInvoices | filters, format | OWNER, KASIR | CSV/PDF/Excel |

#### Payment Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| processPayment | invoiceId, paymentMethod, amount | KASIR | Amount >= remaining balance |
| recordPayment | paymentNumber, invoiceId, amount, method | KASIR | Record payment |
| getPaymentHistory | invoiceId | Authenticated | Payment records |
| listPayments | filters, pagination | OWNER, KASIR | Filterable |
| voidPayment | id, reason | OWNER | Extraordinary cases only |
| printReceipt | paymentId | KASIR | Print receipt |

#### Master Data Actions (OWNER Only)
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createService | name, description, category, price, cost | OWNER | Name unique, price >= 0 |
| updateService | id, fields... | OWNER | Price change affects new visits only |
| archiveService | id | OWNER | Soft delete |
| getServiceChangeHistory | serviceId | OWNER | Version history |
| createDrug | name, description, unit, pricePerUnit, costPerUnit, minimumStock | OWNER | Name unique, unit immutable |
| updateDrug | id, fields... (except unit) | OWNER | Unit cannot change |
| archiveDrug | id | OWNER | Soft delete |
| getDrugChangeHistory | drugId | OWNER | Version history |
| createProduct | name, categoryId, price, cost, description?, image?, barcode?, reorderPoint? | OWNER | Name unique |
| updateProduct | id, fields... | OWNER | -- |
| archiveProduct | id | OWNER | Soft delete |
| getProductChangeHistory | productId | OWNER | Version history |
| createProductCategory | name, description?, defaultMargin? | OWNER | Name unique |
| updateProductCategory | id, name?, description? | OWNER | -- |
| archiveProductCategory | id | OWNER | Cannot archive with active products |

#### Stock Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getInventory | -- | Authenticated | All products with stock |
| adjustStock | productId, quantity, reason, notes? | KASIR (with approval if > threshold), OWNER (direct) | Creates StockAdjustment record |
| getStockHistory | productId, dateRange | Authenticated | Movement history |
| getStockAdjustmentRequests | -- | OWNER | Pending approvals |
| approveStockAdjustment | id, notes? | OWNER | Approval workflow |
| rejectStockAdjustment | id, reason? | OWNER | Reject with reason |
| getLowStockAlerts | -- | Authenticated | Products below reorder point |
| recordStockOpname | products, physicalCounts | KASIR, OWNER | Physical count reconciliation |

#### Price Suggestion Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| suggestServicePriceChange | serviceId, newPrice, reason | KASIR | Creates ServiceChangeRequest |
| suggestDrugPriceChange | drugId, newPrice, reason | KASIR | Creates DrugChangeRequest |
| suggestProductPriceChange | productId, newPrice, reason | KASIR | Creates ProductChangeRequest |
| getPriceChangeRequests | filters | OWNER | All pending requests |
| getPriceChangeHistory | productId, dateRange | Authenticated | Change history |
| getPriceChangeImpactAnalysis | changeRequestId | OWNER | # invoices affected |

#### Approval Actions (OWNER Only)
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getPendingApprovals | -- | OWNER | All pending requests |
| approvePriceChange | changeRequestId, notes | OWNER | Price updated, logged |
| rejectPriceChange | changeRequestId, notes | OWNER | Rejected with reason |
| approveDiscount | discountId, notes | OWNER | Discount finalized |
| rejectDiscount | discountId, notes | OWNER | Discount reversed |
| approveStockAdjustment | adjustmentId, notes | OWNER | Stock updated |
| rejectStockAdjustment | adjustmentId, notes | OWNER | Rejected with reason |
| approveSupplier | supplierId, notes | OWNER | Supplier activated |
| rejectSupplier | supplierId, notes | OWNER | Supplier rejected |
| approveReconciliation | reconciliationId, notes | OWNER | Day locked |
| requestReconciliationRevision | reconciliationId, notes | OWNER | Sent back to KASIR |
| getApprovalHistory | filters | OWNER | All approval records |

#### Hotel Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getAvailableRooms | checkInDate, checkOutDate | Authenticated | Returns open rooms |
| createHotelBooking | customerId, petId[], roomId, dates, services[] | KASIR, CUSTOMER (own) | Room availability checked |
| updateHotelBooking | id, data | KASIR | Only CONFIRMED bookings |
| cancelHotelBooking | id, reason | KASIR, CUSTOMER (own) | Cancellation policy |
| checkInHotel | id | KASIR | Status → CHECKED_IN |
| checkOutHotel | id | KASIR | Status → CHECKED_OUT, generate invoice |
| addBookingService | bookingId, serviceType, quantity | KASIR | Only while CHECKED_IN |
| getHotelOccupancy | dateRange | Authenticated | Occupancy stats |
| getHotelRevenue | dateRange | Authenticated | Revenue stats |
| printHotelInvoice | bookingId | Authenticated | Generate PDF |

#### Supplier Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createSupplier | supplierData | KASIR (suggest), OWNER (approve) | Requires OWNER approval |
| updateSupplier | id, data | OWNER | -- |
| listSuppliers | filters | Authenticated | Filterable by status, specialization |
| getSupplierPerformance | supplierId | Authenticated | On-time, quality metrics |
| createPurchaseOrder | supplierId, items[] | KASIR | Budget threshold check |
| approvePurchaseOrder | poId | OWNER (if > threshold) | Auto-approve if < threshold |
| recordGoodsReceipt | poId, items[] | KASIR | Auto-update stock |
| getCancelledPoHistory | -- | Authenticated | Cancelled PO records |

#### Reconciliation Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| submitDailyReconciliation | date, kasirData | KASIR | End-of-day close |
| getPendingReconciliations | -- | OWNER | Pending reviews |
| getDailyReconciliation | date | Authenticated | Single day record |
| approveReconciliation | id | OWNER | Day locked |
| requestReconciliationRevision | id, notes | OWNER | Sent back to KASIR |
| getReconciliationHistory | dateRange | Authenticated | Historical records |
| getReconciliationReport | dateRange | Authenticated | Summary report |

#### User Actions (OWNER Only)
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createUser | name, email, phone?, role, password | OWNER | Email unique |
| updateUser | id, fields... | OWNER | -- |
| updateUserRole | id, roleId | OWNER | Role must exist |
| deactivateUser | id | OWNER | Cannot disable self |
| reactivateUser | id | OWNER | -- |
| resetUserPassword | id | OWNER | Generate temp password, send email |
| changePassword | userId, oldPassword, newPassword | Authenticated | Password rules enforced |
| getUserActivity | userId | OWNER | Login history, actions |
| lockUser | id, duration | OWNER | Account lockout |
| unlockUser | id | OWNER | -- |
| getFailedLoginAttempts | userId | OWNER | Security audit |

#### Settings Actions (OWNER Only)
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getSettings | key | OWNER | Fetch current settings |
| updateCompanyInfo | data | OWNER | -- |
| updateTaxConfig | active, type, value | OWNER | -- |
| updatePaymentMethods | methods[] | OWNER | At least 1 active (Cash) |
| updateNumberingFormat | format[] | OWNER | -- |
| updateHotelRates | rates[] | OWNER | -- |
| updateFraudPolicies | policies | OWNER | -- |
| getSettingChangeHistory | key | OWNER | Version history |
| revertSetting | key, version | OWNER | Revert to previous |

#### Report Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getDailyRevenueReport | date | OWNER, KASIR | -- |
| getRevenueByMethodReport | dateRange | OWNER, KASIR | -- |
| getRevenueByServiceReport | dateRange | OWNER, KASIR | -- |
| getInventoryReport | dateRange | OWNER, KASIR | -- |
| getInventoryTurnoverReport | dateRange | OWNER, KASIR | FIFO/weighted avg |
| getReceivablesAgingReport | -- | OWNER, KASIR | -- |
| getCollectionRateReport | dateRange | OWNER, KASIR | -- |
| getVisitStatisticsReport | dateRange | OWNER, DOKTER | -- |
| getDiagnosisBreakdownReport | dateRange | OWNER, DOKTER | -- |
| getVaccinationReport | dateRange | OWNER, DOKTER | -- |
| getHotelOccupancyReport | dateRange | OWNER, KASIR | -- |
| getSupplierPerformanceReport | dateRange | OWNER, KASIR | -- |
| getDiscountReport | dateRange | OWNER | -- |
| getPriceChangeReport | dateRange | OWNER | -- |
| getStockAdjustmentReport | dateRange | OWNER | -- |
| getAllReports | filters | Per permission | Exportable to CSV/PDF/Excel |

#### Audit Log Actions (OWNER Only)
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getAuditLogs | filters, pagination | OWNER | Filterable by user, action, entity, date |
| getAuditTrailForEntity | entityType, entityId | OWNER | Full change history |
| getUserActivity | userId, dateRange | OWNER | Login history, actions |
| searchAuditLogs | keywords, filters | OWNER | Full-text search |
| getAnomalyReport | -- | OWNER | Suspicious activities |
| exportAuditLogs | filters, format | OWNER | CSV/PDF/Excel |

#### Notification Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getNotifications | none | Authenticated | Return user's notifications |
| markAsRead | notificationId | Authenticated | Owner of notification only |
| markAllAsRead | none | Authenticated | -- |

### 15.4 Route Handler Reference

| Route | Method | Purpose |
|---|---|---|
| /api/auth/[...nextauth] | GET/POST | Auth.js handlers |
| /api/upload | POST | File upload to Supabase Storage |
| /api/health | GET | Health check endpoint |
| /api/notifications/[id]/read | POST | Mark notification as read |
| /api/notifications/mark-all-read | POST | Mark all as read |
| /api/cron/cleanup | GET | Cleanup job (old temp files, lock reconciliations) |

### 15.5 Query Functions (Fetch Operations for Client Components)

```
fetchUser(userId)
fetchCustomer(customerId)
fetchPet(petId)
fetchVisit(visitId)
fetchAppointment(appointmentId)
fetchInvoice(invoiceId)
fetchPrescription(prescriptionId)
fetchService(serviceId)
fetchDrug(drugId)
fetchProduct(productId)
fetchSupplier(supplierId)
fetchHotelBooking(bookingId)
fetchHotelRoom(roomId)
listVisits(filters, pagination)
listAppointments(filters, pagination)
listInvoices(filters, pagination)
listPrescriptions(filters, pagination)
listServices(filters)
listDrugs(filters)
listProducts(filters, pagination)
listSuppliers(filters)
listHotelBookings(filters, pagination)
getAllNotifications(userId, limit)
```

---

## 16. VALIDATION RULES

### 16.1 Shared Validation Schemas (Zod)

| Entity | Required Fields | Constraints |
|---|---|---|
| Customer | name, phone, address | phone: unique, 10-20 digits, name: 1-255 chars |
| Pet | name, species | name: 1-255 chars, species: enum, weight: >= 0 |
| Appointment | customerId, petId, doctorId, date, time | Date must be future, slot must be available |
| Visit | customerId, petId, chiefComplaint, diagnosis | chief_complaint: 1+ chars, diagnosis: 1+ chars |
| VisitItem | itemType, itemId, quantity | quantity: >= 1, item_id must exist and be active |
| Billing | customerId, petId | -- |
| BillingItem | itemType, itemId, quantity | quantity: >= 1 |
| Service | name, category, price | name: 1-100 chars, unique, price: >= 0 |
| Drug | name, unit, pricePerUnit | name: 1-100 chars, unique, price: >= 0 |
| Product | name, categoryId, price | name: 1-100 chars, unique, price: >= 0, category must exist |
| ProductCategory | name | name: 1-100 chars, unique |
| PosOrderItem | productId, quantity | quantity: >= 1, product must exist and have stock |
| Payment | invoiceId, paymentMethod, amount | amount: > 0, must cover remaining balance |
| User | name, email, role | email: valid, unique, role must exist |
| HotelBooking | customerId, petId[], roomId, checkInDate, checkOutDate | Dates valid, room available |
| Supplier | name, phone, address | name unique, phone format valid |
| PurchaseOrder | supplierId, items[] | At least 1 item, supplier active |

### 16.2 Business Logic Validation

- Cannot create visit for non-existent customer or pet
- Cannot complete billing with zero items
- Cannot process payment exceeding invoice amount (for visit/billing)
- Cannot modify completed or paid transactions
- Cannot apply archived service, drug, or product
- Stock cannot go negative
- At least 1 payment method must be active
- DOKTER cannot modify prices
- KASIR cannot modify master data
- Only OWNER can configure system settings
- CUSTOMER can only access own data in portal
- Discount > threshold requires OWNER approval
- Stock adjustment > threshold requires OWNER approval
- New suppliers require OWNER approval
- Daily reconciliation requires OWNER approval to lock

---

## 17. ERROR HANDLING

### 17.1 Error Response Format

```typescript
type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    field?: string;
    code?: string;
  };
}
```

### 17.2 Error Types

| Code | Description | User Message |
|---|---|---|
| UNAUTHORIZED | Not authenticated | "Please log in to continue" |
| FORBIDDEN | Insufficient permissions | "You do not have permission to perform this action" |
| NOT_FOUND | Resource not found | "The requested resource was not found" |
| VALIDATION | Input validation failed | Specific field error message |
| CONFLICT | Duplicate resource | "A record with this [field] already exists" |
| INSUFFICIENT_STOCK | Product stock too low | "Insufficient stock for [product]. Available: [qty]" |
| INVALID_PAYMENT | Payment amount invalid | "Payment amount must cover the remaining balance" |
| BUSINESS_RULE | Business rule violation | Specific rule violation message |
| APPROVAL_REQUIRED | Needs OWNER approval | "This action requires owner approval" |

---

## 18. AUDIT TRAIL

### 18.1 Tracked Actions
- All CREATE, UPDATE, DELETE on master data (services, drugs, products, categories)
- All visit creation, completion, and payment
- All billing creation, item addition, completion, and payment
- All POS transactions
- All payment processing
- All user management actions (create, update, disable, password reset)
- All settings changes
- All stock adjustments
- All price change requests and approvals
- All discount applications
- All supplier additions and PO approvals
- All daily reconciliation submissions and approvals
- All appointment creation, modification, cancellation

### 18.2 Audit Record Fields
- user_id (who performed the action)
- action (CREATE, UPDATE, DELETE, ARCHIVE, PAYMENT, STATUS_CHANGE, APPROVE, REJECT)
- entity_type (model name)
- entity_id (record ID)
- changes (JSON: { field: { old: value, new: value } })
- ip_address
- user_agent
- timestamp

### 18.3 Retention
- Rolling 12-month retention
- Older records archived (not deleted)
- OWNER can view audit logs for any entity
- Immutable (cannot modify or delete)
- Export compliance — Full audit trail exportable for auditors
- Access logs — Track who accessed what data & when
- Failed attempts — Login failures, permission denied attempts tracked

---

## 19. FILE STORAGE

### 19.1 Supabase Storage

| Bucket | Purpose | Access |
|---|---|---|
| avatars | User profile images | Public read, authenticated write |
| products | Product images | Public read, OWNER write |
| clinic | Clinic logo | Public read, OWNER write |
| documents | Generated PDFs (invoices, prescriptions) | Authenticated read, system write |
| uploads | General file uploads | Authenticated read/write |
| pets | Pet photos | Public read, authenticated write |

### 19.2 Upload Constraints
- Maximum file size: 5MB
- Allowed types: jpg, jpeg, png, webp, pdf
- Files stored with UUID-based names
- Server-side file type validation
- Storage bucket RLS policies

---

## 20. PERFORMANCE STRATEGY

### 20.1 Rendering
- React Server Components for all data-fetching pages
- Client Components only for interactive elements (forms, dialogs, charts)
- Streaming with Suspense for progressive loading

### 20.2 Data Fetching
- Server Components fetch data directly (no API overhead)
- TanStack Query for client-side data that requires caching/refetching
- Optimistic updates for mutations

### 20.3 Caching
- Dashboard Stats: cached 15 seconds
- Chart Data: cached 30 seconds
- Master Data: cached 5 minutes
- Server-side Cache via `cached()` from `server/lib/cache.ts`
- Query Optimization — Indexed fields for fast lookup
- Lazy Loading — Components load on-demand

### 20.4 Targets
- Initial page load: < 3 seconds
- Navigation: < 1 second
- Search response: < 1 second (10k+ records)
- Report generation: < 10 seconds (full month)
- API response: < 500ms (95th percentile)
- Database query: < 100ms (average)
- Concurrent users: 100+ without degradation
- Uptime: 99.5% (excluding scheduled maintenance)

---

## 21. SECURITY STRATEGY

### 21.1 Authentication
- Auth.js session-based authentication (JWT strategy)
- Bcrypt password hashing (12 rounds)
- CSRF protection via Auth.js built-in
- Secure cookie flags (httpOnly, secure, sameSite)
- Session timeout: 12 hours
- Account lockout: 5 failed attempts → 30 minutes

### 21.2 Authorization
- Server-side role verification in every Server Action
- Middleware-based route protection
- Component-level role checks for UI rendering
- No sensitive data exposed to unauthorized roles

### 21.3 Rate Limiting
- Auth: 10 requests per 15 minutes per IP
- Upload: 10 requests per minute per user
- API routes: 100 requests per minute per IP

### 21.4 Data Protection
- All database queries via Prisma (parameterized, no SQL injection)
- React auto-escaping (no XSS)
- Input validation via Zod at every entry point
- HTTPS enforced in production
- Environment variables for all secrets

---

## 22. TESTING STRATEGY

### 22.1 Unit Tests (Vitest)
- All server utility functions
- Zod validation schemas
- Number generation, tax calculation, date formatting
- Permission checks (RBAC enforcement)
- Price change approval logic
- Discount tracking & limits
- Stock adjustment approval logic
- Daily reconciliation logic
- Coverage target: > 80% for business logic

### 22.2 Integration Tests (Vitest)
- Server Actions with mocked Prisma
- Auth flows and authorization checks
- End-to-end visit workflow (DOKTER → Invoice → KASIR → Payment)
- Price change workflow (KASIR suggest → OWNER approve)
- Discount workflow (KASIR apply → auto/manual approval)
- Daily reconciliation (KASIR submit → OWNER review)
- Stock adjustment (KASIR request → OWNER approve)
- Appointment booking (CUSTOMER → DOKTER → payment)
- Hotel booking (CUSTOMER → KASIR process → invoicing)
- Supplier order (KASIR PO → receive → stock update)
- All roles' data access (no unauthorized access)
- Audit trails (all actions logged completely)

### 22.3 Security Tests
- KASIR cannot edit master data (directly accessing API)
- DOKTER cannot access financial data
- CUSTOMER cannot see other customer's data
- Unauthorized role cannot access restricted routes
- All password hashing working (bcrypt)
- Session timeouts working (12 hours)
- Rate limiting working
- Account lockout working
- Audit log immutable
- Soft deletes working

### 22.4 Fraud Prevention Tests
- KASIR cannot change prices directly
- Price change requires OWNER approval
- All price changes logged (who, when, old→new)
- Discount > threshold requires OWNER approval
- All discounts logged & immutable
- Stock adjustment > threshold requires approval
- Daily reconciliation locks transactions
- Cannot modify locked transactions
- Full audit trail (cannot delete, modify, or hide)

### 22.5 E2E Tests (Playwright)
- Complete visit workflow (create → complete → pay)
- POS transaction flow
- Billing workflow
- Customer portal flows (login, booking, invoice view)
- Appointment booking flow
- Hotel booking flow
- Login/logout flows
- CRUD operations for master data
- Permission enforcement
- Responsive layouts

### 22.6 Test Organization
```
tests/
├── unit/
│   ├── lib/
│   │   ├── numbers.test.ts
│   │   ├── tax.test.ts
│   │   └── validators.test.ts
│   └── server/actions/
├── integration/
│   ├── server/actions/
│   └── api/
└── e2e/
    ├── auth.spec.ts
    ├── visits.spec.ts
    ├── pos.spec.ts
    ├── billing.spec.ts
    ├── customers.spec.ts
    ├── portal.spec.ts
    ├── appointments.spec.ts
    ├── hotel.spec.ts
    ├── suppliers.spec.ts
    ├── reconciliation.spec.ts
    └── master-data.spec.ts
```

---

## 23. DEPLOYMENT STRATEGY

### 23.1 Target Stack
- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Email:** Resend
- **CI/CD:** GitHub Actions
- **Repository:** GitHub

### 23.2 Deployment Pipeline

```
GitHub Push (main branch)
    → GitHub Actions
    → Install Dependencies (pnpm install)
    → Lint & Type Check (pnpm lint && pnpm typecheck)
    → Run Tests (pnpm test)
    → Build Next.js (pnpm build)
    → Vercel Preview (PR) / Production (main)
    → Prisma Generate
    → Prisma Migrate Deploy
    → Health Check
    → Deploy Complete
```

### 23.3 Database Bootstrap

```
1. prisma generate
2. prisma migrate deploy
3. Run seed script (idempotent):
   - Seed roles (OWNER, DOKTER, KASIR, CUSTOMER) — 4 roles only
   - Seed permissions
   - Seed role-permission mappings
   - Seed default services (Konsultasi, Vaksinasi, Grooming, etc.)
   - Seed default drugs (Amoxicillin, Paracetamol, etc.)
   - Seed default product categories (Food, Medicine, Accessories, etc.)
   - Seed default payment methods (Cash)
   - Seed default settings (company info, tax config, numbering format)
4. Bootstrap Supabase Storage:
   - Create buckets (avatars, products, clinic, documents, uploads, pets)
   - Set bucket policies
   - Set RLS policies
5. Health check
```

### 23.4 Environment Variables

| Variable | Source | Required | Description |
|---|---|---|---|
| DATABASE_URL | Supabase | Yes | PostgreSQL connection string |
| NEXTAUTH_SECRET | Vercel | Yes | Auth.js session secret |
| NEXTAUTH_URL | Vercel | Yes | Application base URL |
| SUPABASE_URL | Supabase | Yes | Supabase project URL |
| SUPABASE_ANON_KEY | Supabase | Yes | Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase | Yes | Supabase service role key |
| RESEND_API_KEY | Resend | Yes | Resend email API key |
| RESEND_FROM_EMAIL | Resend | Yes | Sender email address |
| NEXT_PUBLIC_APP_URL | Vercel | Yes | Public application URL |
| NEXT_PUBLIC_SUPABASE_URL | Supabase | Yes | Public Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase | Yes | Public Supabase anon key |

### 23.5 Development Setup

```bash
git clone <repo-url>
cd klinik-hewan
pnpm install
cp .env.example .env
# Configure .env with local values
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Application available at http://localhost:3000.

---

## 24. MONITORING & DISASTER RECOVERY

### 24.1 Application Monitoring
- Vercel Analytics for performance metrics
- Vercel Speed Insights for Core Web Vitals
- Custom /api/health endpoint for uptime monitoring
- Vercel Error Tracking for server errors

### 24.2 Backup Strategy
- **Database:** Supabase automatic daily backups
- **Storage:** Supabase handles storage redundancy
- **Code:** GitHub repository (distributed)
- **Environment Variables:** Stored in Vercel (encrypted)

### 24.3 Recovery Procedures
1. **Database Recovery:** Restore from Supabase backup dashboard
2. **Application Recovery:** Redeploy from GitHub main branch
3. **Full Recovery:** Clone repo, configure env, run migrations, restore database backup

### 24.4 RPO and RTO
- **RPO:** 24 hours (daily backups)
- **RTO:** 1 hour (redeploy + restore)

---

## 25. CODING STANDARDS

### 25.1 TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types on all functions
- Interface names: PascalCase, no `I` prefix

### 25.2 React Components
- Functional components only
- Server Components by default
- Client Components only when state/effects needed
- File naming: kebab-case for files, PascalCase for components
- One component per file

### 25.3 Server Actions
- Named exports (not default)
- "use server" directive at top of file
- Zod validation before any database operation
- Auth check before business logic
- Audit logging after successful mutations
- Consistent return type (ActionResult)

### 25.4 Prisma
- Schema-first approach
- Migrations for all schema changes
- Use `select` to limit returned fields
- Use `include` for required relations
- Transactions for multi-step mutations
- Soft deletes via status field (no hard deletes on business data)

### 25.5 File Naming
- Pages: page.tsx
- Layouts: layout.tsx
- Components: kebab-case.tsx
- Server Actions: camelCase.ts
- Utilities: camelCase.ts
- Types: camelCase.ts
- Tests: *.test.ts (unit/integration), *.spec.ts (e2e)

### 25.6 CSS
- Tailwind CSS only
- No inline styles, no CSS modules
- shadcn/ui components for consistency
- Responsive design via Tailwind breakpoints

---

## 26. NAMING CONVENTIONS

### 26.1 Database
- Tables: snake_case, plural (customers, visit_items)
- Columns: snake_case (created_at, customer_id)
- Indexes: idx_[table]_[column]
- Foreign keys: [referenced_table]_id
- Enums: UPPER_SNAKE_CASE

### 26.2 Code
- Variables: camelCase
- Functions: camelCase
- Components: PascalCase
- Types/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case

### 26.3 Routes
- Pages: /section/entity (e.g., /customers, /visits/new)
- Parameters: [id] (dynamic segments)

---

## 27. ACCEPTANCE CRITERIA

### 27.1 Authentication
- [ ] User can log in with email and password
- [ ] Invalid credentials show clear error message
- [ ] Account locks after 5 failed attempts for 30 minutes
- [ ] Password reset sends email with valid link
- [ ] Session expires after 12 hours of inactivity
- [ ] Logout clears session
- [ ] Role-based redirect on login

### 27.2 Customer Management
- [ ] Staff can create customer with name, phone, address
- [ ] Phone number is unique across all customers
- [ ] Staff can edit customer profile
- [ ] Staff can view customer with all pets
- [ ] Customer portal account auto-created on registration

### 27.3 Pet Management
- [ ] Staff can add pet to customer
- [ ] Customer can add pet via portal
- [ ] Pet archived (not deleted) when removed
- [ ] Archived pets hidden from selection dropdowns

### 27.4 Appointment Scheduling
- [ ] Customer can book appointment via portal
- [ ] DOKTER can create appointment for walk-in
- [ ] Slot availability checked before booking
- [ ] Appointment status flow works (PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW)
- [ ] Appointment links to visit creation

### 27.5 Visit Workflow
- [ ] DOKTER can create visit with customer, pet, complaint, diagnosis
- [ ] DOKTER can select multiple services and drugs
- [ ] Prices are captured from master data (read-only to DOKTER)
- [ ] Visit saves as DRAFT
- [ ] DOKTER can complete visit
- [ ] Invoice auto-generated on visit completion
- [ ] Prescription auto-generated from drug items
- [ ] KASIR notified of new invoice

### 27.6 Billing
- [ ] Staff can create billing for customer and pet
- [ ] Items can be added while billing is OPEN
- [ ] Billing can be completed to generate invoice
- [ ] Completed billing items are immutable

### 27.7 POS
- [ ] KASIR can search and add products
- [ ] Stock is checked before adding to cart
- [ ] Subtotal, tax, discount, and total calculate correctly
- [ ] Payment processed with correct change calculation
- [ ] Stock decreases on order completion
- [ ] Discount approval workflow works (> threshold)

### 27.8 Payment
- [ ] Payment recorded against correct invoice
- [ ] Invoice status updates correctly (UNPAID → PARTIAL → PAID)
- [ ] Partial payments recorded correctly
- [ ] Payments cannot be deleted

### 27.9 Master Data (OWNER Only)
- [ ] OWNER can CRUD services, drugs, products
- [ ] KASIR cannot edit master data (view-only)
- [ ] Archived items hidden from selection but visible in history
- [ ] Product categories cannot be deleted with active products
- [ ] Drug unit cannot be changed after creation
- [ ] Service price changes affect only new visits
- [ ] Change history tracked for all master data

### 27.10 Fraud Prevention
- [ ] Price change requires OWNER approval
- [ ] Discount > threshold requires OWNER approval
- [ ] Stock adjustment > threshold requires OWNER approval
- [ ] New suppliers require OWNER approval
- [ ] All changes logged with audit trail
- [ ] Audit trail immutable

### 27.11 Daily Reconciliation
- [ ] KASIR can submit daily reconciliation
- [ ] OWNER can approve or request revision
- [ ] Approved reconciliation locks transactions
- [ ] Discrepancies flagged and tracked

### 27.12 Hotel Management
- [ ] KASIR can create hotel booking
- [ ] Customer can book via portal
- [ ] Room availability checked
- [ ] Add-on services tracked
- [ ] Hotel invoice generated on checkout

### 27.13 Supplier Management
- [ ] KASIR can suggest new supplier (requires OWNER approval)
- [ ] KASIR can create purchase order
- [ ] PO > budget requires OWNER approval
- [ ] Goods receipt updates stock automatically

### 27.14 Customer Portal
- [ ] Customer can log in and view dashboard
- [ ] Customer can view all pets
- [ ] Customer can book appointments
- [ ] Customer can view visit history
- [ ] Customer can view and download invoices
- [ ] Customer can view and download prescriptions
- [ ] Customer can book hotel rooms
- [ ] Customer can edit own profile
- [ ] Customer cannot access other customers' data

### 27.15 Reports
- [ ] OWNER can view all reports
- [ ] KASIR can view financial reports
- [ ] DOKTER can view clinical reports only
- [ ] Reports can be exported as CSV/PDF/Excel

### 27.16 Notifications
- [ ] Email sent on visit completion, invoice generation, payment confirmation
- [ ] Low stock alert sent to OWNER
- [ ] In-app notifications displayed in bell component
- [ ] Notifications marked as read on click

### 27.17 Security
- [ ] Unauthorized users cannot access protected routes
- [ ] DOKTER cannot access master data management or financial data
- [ ] KASIR cannot modify services, drugs, or products
- [ ] CUSTOMER cannot access other customers' data
- [ ] All form inputs validated server-side
- [ ] Audit trail recorded for all mutations

---

## 28. IMPLEMENTATION PRIORITIES

### Phase 1: Core Foundation (Week 1-2)
- Authentication & authorization (4 roles)
- Customer & pet management
- Master data (services, drugs, products — OWNER only)
- Visit workflow (DOKTER → auto-invoice)
- Basic POS
- Invoice & payment processing
- Basic dashboard per role
- Navigation per role

### Phase 2: Fraud Prevention (Week 3-4)
- Approval workflow models (ServiceChangeRequest, DrugChangeRequest, ProductChangeRequest)
- DiscountLog model
- StockAdjustmentApproval model
- DailyReconciliation model
- Price change approval UI (OWNER)
- Discount tracking & approval
- Stock adjustment approval
- Audit log system (immutable)

### Phase 3: New Features (Week 5-7)
- Appointment & Scheduling (DoctorSchedule, Appointment models)
- Pet Hotel/Boarding (HotelBooking, HotelRoom, HotelService models)
- Supplier Management (Supplier, PurchaseOrder, GoodsReceipt models)
- Daily Reconciliation workflow
- Customer portal enhancements (appointments, hotel bookings)

### Phase 4: Reporting & Polish (Week 8-9)
- Executive KPI dashboard
- Financial reports (all types)
- Operational reports (all types)
- Hotel analytics
- Supplier performance reports
- Anomaly detection & alerts
- Performance optimization
- Email notifications

---

## 29. GLOSSARY

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

## 30. KNOWN LIMITATIONS

- Single timezone support (not multi-timezone)
- Currency support (IDR only, but framework supports multi-currency)
- Backup interval (daily, not real-time sync)
- Concurrent user limit (tested up to 100 concurrent)
- File upload size (5MB max per file)
- Historical data retention (keeps all, no archival)
- No soft-delete for audit logs (permanent immutable record)
- Email delivery (depends on SMTP configuration)

---

## 31. DEPLOYMENT CHECKLIST

### Before Going Live
- [ ] Database backed up
- [ ] All migrations tested on staging
- [ ] All tests passing (unit, integration, security)
- [ ] Security audit completed
- [ ] Performance testing done (load test)
- [ ] Audit logs verified (completeness)
- [ ] All role permissions verified (4 roles only)
- [ ] Documentation completed
- [ ] User training completed
- [ ] Rollback plan documented
- [ ] Monitoring setup (error tracking, performance)
- [ ] Backup & recovery tested
- [ ] Legal/compliance review done
- [ ] Go-live approval from OWNER

### Post-Deployment
- [ ] Monitor for errors (first 24 hours)
- [ ] Check performance metrics
- [ ] Verify all audit logs working
- [ ] Spot-check approval workflows
- [ ] Confirm users can access correct data
- [ ] Test edge cases (large transactions, many items)
- [ ] Gather feedback from users

---

**END OF DOCUMENT**

**Document Authority:** This PRD is the single source of truth for PetCare development. All technical decisions, feature scope, and priorities are based on this document. Changes must be discussed and updated in this PRD before implementation.

**Last Reviewed:** July 2026
**Next Review:** Monthly or upon major feature addition
