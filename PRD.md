# HALAND PETCARE - PRODUCT REQUIREMENTS DOCUMENT

**Version:** 2.0
**Date:** 2026-07-23
**Status:** Production Specification
**Architecture:** Next.js Full Stack

---

## 1. PRODUCT VISION

Haland PetCare is a production-ready veterinary clinic platform that centralizes customer management, pet care, medical records, billing, POS, inventory, and reporting into a single application. The system serves four user roles: Owner, Doctor (Dokter), Cashier (Kasir), and Customer, each with distinct interfaces and permissions. The platform prioritizes simplicity, maintainability, and predictable behavior across all workflows.

---

## 2. PRODUCT GOALS

- Single application, single database, single repository
- Zero complex configuration setup
- Clear role and permission separation
- Automated billing and pricing
- Intuitive customer portal
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

## 4. DESIGN PHILOSOPHY

- Convention over Configuration
- Single Source of Truth
- Server First
- Type Safe
- Zero Boilerplate
- Feature Based Architecture
- Domain Driven Organization
- High Cohesion
- Low Coupling
- Minimal Runtime Complexity
- Minimal Environment Variables
- Maximum Readability

---

## 5. TECHNOLOGY STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router |
| Rendering | React Server Components, Server Actions, Route Handlers |
| Language | TypeScript (Strict) |
| Database | PostgreSQL 14+ |
| ORM | Prisma |
| Authentication | Auth.js (NextAuth.js) |
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
- Visit Workflow (create, complete, auto-invoice)
- Medical Records (visit notes, diagnosis, treatment)
- Service Management (tindakan, pricing)
- Drug Management (obat, pricing, units)
- Product Management (retail products, categories, stock)
- Billing Module (perawatan bertahap: rawat inap, pet hotel)
- POS Module (retail sales)
- Payment Processing (multiple methods, invoice settlement)
- Invoice Generation and PDF export
- Prescription Generation and PDF export
- Stock Management (tracking, adjustment, reorder alerts)
- Reporting (daily sales, visits, inventory, revenue, customers, payments)
- Customer Portal (history, records, invoices, prescriptions, profile)
- Owner Dashboard (analytics, master data, user management, settings)
- Role-based access control (Owner, Doctor, Cashier, Admin)
- Audit trail for transactions and master data changes
- Email notifications (visit completion, invoice, payment confirmation, low stock)
- In-app notifications (simple read/unread)
- Auto-numbering for invoices, receipts, prescriptions, visits, billings
- Tax calculation (flat or percentage)
- Discount management (per-transaction)
- Responsive design (mobile-first for customer portal)
- Dark mode toggle

### Out of Scope

- Appointment scheduling system
- SMS/WhatsApp integration (email only)
- Multi-location/multi-branch support
- Advanced analytics/BI tools
- Video consultation
- Supply chain management (PO to vendor)
- Insurance claim processing
- AI-powered diagnostics
- Real-time inventory sync with multiple warehouses
- Loyalty program/membership system
- Advanced medical imaging/DICOM
- Payment gateway integration (architecture ready for future)

---

## 7. USER ROLES

| Role | Access Level | Description |
|---|---|---|
| Owner | Full access | Master data CRUD, user management, configuration, all reports, analytics |
| Doctor (Dokter) | Medical operations | Create/read visits, input diagnosis, prescribe drugs, view invoices. Cannot modify prices or create master data |
| Cashier (Kasir) | Payment operations | Process payments, create POS orders, view billing. Read-only for visits and medical records |
| Admin | Operational assist | User management assist, stock opname, report assist. Cannot configure business rules |
| Customer | Portal access | View own pets, visits, medical records, invoices, prescriptions. Edit own profile |

**Minimum Requirements:**
- At least 1 Owner account per clinic
- Multiple Doctors allowed
- Multiple Cashiers allowed
- Admin is optional

---

## 8. FUNCTIONAL REQUIREMENTS

### 8.1 Authentication and Authorization

#### 8.1.1 Login System
- Email-based login using Auth.js
- Password hashing via bcrypt (default)
- Password reset via email link (Resend)
- Session-based authentication via Auth.js
- Remember-me checkbox (optional)
- Maximum 5 failed login attempts triggers 30-minute account lockout
- Password minimum 8 characters, must include uppercase, lowercase, and number
- Session timeout: 12 hours of inactivity
- Customer portal uses separate auth route

#### 8.1.2 Role and Permission System

Four fixed roles seeded at database initialization. Permissions are not changeable via UI.

| Role | Permissions |
|---|---|
| Owner | All CRUD for master data, user management, system configuration, full report access, audit log viewing |
| Doctor | Create/read visits, input diagnosis, prescribe drugs, view invoices, export visit notes as PDF. Cannot edit prices or create master data |
| Cashier | Read-only visits/medical records, process payments, create POS orders, view billing. Cannot modify master data |
| Admin | User management assist, stock opname, report assist. Cannot configure business rules |
| Customer | View own profile, pets, visits, medical records, invoices, prescriptions. Edit own profile and pets |

#### 8.1.3 Authorization Enforcement
- Middleware-based route protection per role
- Server-side validation in every Server Action
- Client-side UI adaptation based on role (hide unauthorized elements)
- Audit log for all authorization failures

### 8.2 Customer Management

#### 8.2.1 Customer Registration
- Staff (Doctor or Cashier) creates customer during walk-in
- Required fields: name, phone (unique), address
- Optional fields: email (recommended for portal access)
- System auto-generates user account with temporary password sent via email
- Customer status defaults to ACTIVE
- Duplicate check based on exact name + phone combination
- Customers cannot self-register

#### 8.2.2 Customer Profile
- View and edit: name, phone, email, address
- View all associated pets
- View visit history
- View invoices and payment history

#### 8.2.3 Pet Management
- One customer may have multiple pets
- Pet fields: name, species (select: dog, cat, bird, rabbit, hamster, other), breed, birth date or estimated age, weight (kg), color/marking, medical history notes (owner-provided, not formal medical records)
- Pets cannot be permanently deleted (soft delete only, status = ARCHIVED)
- Medical history notes are owner-provided information, not clinical records

### 8.3 Visit Workflow

#### 8.3.1 Visit Creation
1. Doctor searches and selects customer
2. Doctor selects pet from customer's pet list
3. Doctor inputs: visit date/time, chief complaint, physical exam notes (optional), diagnosis, treatment notes
4. Doctor records vital signs (optional): weight, temperature, heart rate
5. Doctor selects services from master list (multiple, with fixed prices)
6. Doctor selects drugs from master list (multiple, with quantity, fixed prices)
7. System calculates subtotal from all selected items
8. Visit status = DRAFT

#### 8.3.2 Visit Completion
1. Doctor clicks "Complete Visit"
2. System auto-generates invoice from visit items
3. Visit status = COMPLETED
4. Invoice number generated: VIS-YYYY-MMDD-XXXXX for visit, INV-YYYY-MMDD-XXXXX for invoice
5. Invoice status = UNPAID

#### 8.3.3 Visit Payment
1. Cashier receives payment through POS module
2. Payment amount must be >= invoice total
3. Full payment: Invoice status = PAID, Visit status = PAID
4. Partial payment: Invoice status remains UNPAID, payment recorded
5. Change calculated automatically for cash payments

#### 8.3.4 Business Rules
- Visits cannot be deleted (only editable while DRAFT)
- Every visit must reference a valid pet
- Diagnosis and treatment must have at least 1 entry
- Prices are captured from master data at time of visit creation (immutable for historical records)
- Doctor cannot modify service/drug prices
- Doctor cannot create or archive services or drugs
- Doctor can view pet history and export visit notes as PDF

### 8.4 Billing Module (Perawatan Bertahap)

#### 8.4.1 Workflow
1. Staff creates billing record for customer and pet (OPEN status)
2. Billing number generated: BIL-YYYY-MMDD-XXXXX
3. Staff adds items over time: services, drugs, products
4. Each item captures fixed price at time of addition
5. Items can be added while billing status = OPEN
6. Staff completes billing (OPEN -> COMPLETED)
7. Invoice auto-generated with final amount
8. Payment processed (COMPLETED -> PAID/SETTLED)

#### 8.4.2 Billing Items
- item_type: SERVICE, DRUG, or PRODUCT
- Captures: item reference, quantity, unit_price (fixed at addition), subtotal
- Optional notes per item

#### 8.4.3 Business Rules
- Billing status flow: OPEN -> COMPLETED -> PAID/SETTLED
- Items cannot be deleted after billing is COMPLETED (Owner can edit if revision needed)
- Billing can be monitored in real-time: duration, item count, running total
- Partial payment supported

### 8.5 POS Module

#### 8.5.1 Workflow
1. Cashier starts new transaction (customer selection optional)
2. Cashier searches or scans product
3. Cashier adds product with quantity
4. System calculates: subtotal, tax, total
5. Cashier optionally applies discount (flat or percentage)
6. Cashier selects payment method and inputs amount
7. System calculates change for cash payments
8. Receipt generated: RCP-YYYY-MMDD-XXXXX
9. Transaction completes

#### 8.5.2 Business Rules
- POS orders cannot be edited after completion
- Stock must be available (system checks before submit)
- Payment must be >= total (no arrears for POS)
- Change calculated automatically for cash payment
- Customer selection is optional

### 8.6 Payment and Invoicing

#### 8.6.1 Payment Processing
- Payments can originate from: Visit, Billing, or POS Order
- Payment record captures: payment number, source reference, method, amount, status, notes, receiver
- Payment flow: validate amount >= invoice total, record payment, update invoice status, calculate change
- Partial payments are recorded individually
- Payments cannot be deleted (Owner can revert for extraordinary cases)

#### 8.6.2 Invoice Generation
- Invoices auto-generated when Visit or Billing is completed
- Invoice captures: customer, pet, source reference, dates, subtotal, tax, discount, total, paid amount, status
- Invoice items capture: name, quantity, unit_price, subtotal, category
- Invoice is immutable after PAID status
- Invoices can be downloaded as PDF and emailed to customers

#### 8.6.3 Prescription Generation
- Prescriptions auto-generated from visit drug items
- Prescription number: RX-YYYY-MMDD-XXXXX
- Captures: visit reference, customer, pet, date, status
- Prescription items: drug reference, quantity, dosage, duration, instructions
- Prescriptions can be exported as PDF

### 8.7 Master Data Management

#### 8.7.1 Service Management
- Owner can create, edit, archive services
- Fields: name (unique), description, category, price, status
- Categories: Consultation, Vaccination, Grooming, Surgery, Laboratory, X-Ray, Hospitalization, Other
- Archived services hidden from selection dropdowns but remain in history
- Price changes apply only to new visits

#### 8.7.2 Drug Management
- Owner can create, edit, archive drugs
- Fields: name (unique), description, unit (tablets, capsules, bottle, vial, ampule, gram, ml, drops, other), price_per_unit, status
- Unit cannot be changed after creation
- Archived drugs hidden from selection but remain in history

#### 8.7.3 Product Management
- Owner can create, edit, archive products
- Fields: name (unique), category reference, price, description, image_url, barcode (optional), current_stock, reorder_point, status
- Owner can manage product categories (CRUD with soft delete)
- Archived products hidden from POS selection but remain in order history

#### 8.7.4 Stock Management
- Current stock tracked per product
- Stock decreases on POS order submission
- Stock adjustable via manual stock opname (Owner/Admin only)
- Low stock warning when current_stock < reorder_point
- Stock never goes negative (system rejects insufficient stock)
- Stock adjustment history tracked with reason, reference, and user

#### 8.7.5 Tax Configuration
- Owner configures: type (flat or percentage), value, enabled/disabled
- Tax applied to all transactions
- Tax amount displayed separately on invoices

#### 8.7.6 Discount Management
- Discount applied per-transaction by Cashier
- Type: flat amount or percentage
- Owner can set maximum discount percentage limit

#### 8.7.7 Payment Method Configuration
- Owner configures available payment methods
- Default: Cash (always active)
- Optional: Bank Transfer, Card, e-Wallet, Custom
- Per method: name, status (active/inactive), instructions
- At least 1 payment method must be active (Cash)

#### 8.7.8 Company Configuration
- Fields: clinic name, logo, address, phone, email, operating hours, tax ID, invoice footer notes, receipt footer notes
- Numbering format: invoice prefix, receipt prefix, visit prefix, billing prefix

### 8.8 Owner Dashboard

#### 8.8.1 Dashboard Overview
- Quick stats: today's visits, today's revenue, pending payments, low stock products
- Charts: visits trend (7 days), revenue trend (30 days)
- Pending actions: unpaid invoices, incomplete visits, low stock alerts
- Recent transactions: latest visits, latest payments

#### 8.8.2 User Management
- Owner can create, edit, disable/enable users
- Fields: name, email, phone, role, status
- Owner can reset user passwords
- Owner can view user activity log (audit trail)

#### 8.8.3 Reports
- Daily Report: total visits, total revenue, breakdown by service, top selling product
- Revenue Report: revenue by payment method, by service, by product, growth comparison
- Inventory Report: product list with stock levels, low stock alerts, stock movement
- Customer Report: visit frequency, last visit, total spend, top customers
- Payment Report: unpaid invoices (aging), payment by method, reconciliation

### 8.9 Customer Portal

#### 8.9.1 Portal Access
- Separate route group (/portal/*)
- Customer logs in with email and password
- Mobile-responsive design (primary access device)
- Session managed by Auth.js

#### 8.9.2 Portal Features
- View own pets with details and visit history
- View all visits with filtering (by pet, date range, status)
- View medical records per visit (complaint, diagnosis, treatment, drugs)
- View prescriptions with drug details and instructions
- View invoices and payment history
- Download invoice and prescription PDFs
- Edit profile (name, phone, email, address)
- Add/edit pets (name, species, breed, birth date, weight, color, medical notes)
- Change password
- View in-app notifications

### 8.10 Notifications

#### 8.10.1 Email Notifications
| Event | Recipient | Content |
|---|---|---|
| Customer registered | Owner | New customer registered |
| Visit completed | Customer | Visit summary, invoice created |
| Invoice generated | Customer | Invoice ready, download link |
| Payment received | Customer | Payment confirmed, receipt |
| Low stock | Owner | Product below reorder point |
| Daily summary | Owner | Daily report summary |

Emails sent via Resend. HTML templates with clinic branding.

#### 8.10.2 In-App Notifications
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
| User | System user (Owner, Doctor, Cashier, Admin) |
| Customer | Clinic client with pet ownership |
| Pet | Animal belonging to a customer |
| Service | Medical procedure or treatment (master data) |
| Drug | Medication (master data) |
| Product | Retail item (master data) |
| ProductCategory | Product classification (master data) |
| Visit | Single clinic visit with medical notes |
| VisitItem | Service or drug line item in a visit |
| Billing | Extended care record (hospitalization, pet hotel) |
| BillingItem | Line item in a billing record |
| Invoice | Financial document generated from visit or billing |
| InvoiceItem | Line item in an invoice |
| Prescription | Drug prescription generated from visit |
| PrescriptionItem | Individual drug in a prescription |
| PosOrder | Retail point-of-sale transaction |
| PosOrderItem | Product line item in a POS order |
| Payment | Payment record against any payable source |
| StockAdjustment | Manual stock change record |
| AuditLog | System audit trail entry |
| Notification | In-app notification |
| Setting | System configuration key-value store |
| Role | User role definition (seeded) |
| RolePermission | Role-permission mapping (seeded) |

### 9.2 Entity Relationships

```
User (1) ──→ (N) Visit [created_by]
User (1) ──→ (N) Billing [created_by]
User (1) ──→ (N) StockAdjustment [created_by]
User (1) ──→ (N) Payment [received_by]
User (1) ──→ (N) AuditLog [user_id]
User (1) ──→ (N) Notification [user_id]
User (N) ──→ (1) Role [role_id]

Customer (1) ──→ (N) Pet [customer_id]
Customer (1) ──→ (N) Visit [customer_id]
Customer (1) ──→ (N) Billing [customer_id]
Customer (1) ──→ (N) Invoice [customer_id]
Customer (1) ──→ (N) Prescription [customer_id]
Customer (1) ──→ (1) User [user_id] (optional, for portal access)

Pet (N) ──→ (1) Customer [customer_id]
Pet (1) ──→ (N) Visit [pet_id]
Pet (1) ──→ (N) Billing [pet_id]
Pet (1) ──→ (N) Invoice [pet_id]
Pet (1) ──→ (N) Prescription [pet_id]

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

---

## 10. DATABASE ARCHITECTURE

### 10.1 Database Selection
PostgreSQL 14+ via Supabase. Single database instance. No sharding. Vertical scaling only.

### 10.2 Prisma Schema Design

#### User
```
Purpose: System users for all staff roles and customers with portal access
Relationships: belongs to Role, has many Visits (created_by), Billings (created_by), StockAdjustments (created_by), Payments (received_by), AuditLogs, Notifications
Indexes: email (unique), role_id, status, phone
Constraints: email unique, phone optional unique
Lifecycle: Created by Owner, soft-deletable (status = INACTIVE)
Ownership: Owner manages all users
```

#### Role
```
Purpose: Fixed role definitions seeded at initialization
Relationships: has many Users, has many RolePermissions
Indexes: name (unique)
Constraints: name unique, seeded data only
Lifecycle: Created during seed, not editable via UI
Ownership: System-managed
```

#### RolePermission
```
Purpose: Maps permissions to roles (many-to-many)
Relationships: belongs to Role, belongs to Permission
Indexes: role_id + permission_id (compound unique)
Constraints: role_id + permission_id unique
Lifecycle: Seeded at initialization, not editable via UI
Ownership: System-managed
```

#### Permission
```
Purpose: Individual permission definitions
Relationships: has many RolePermissions
Indexes: name (unique)
Constraints: name unique, seeded data only
Lifecycle: Created during seed, not editable via UI
Ownership: System-managed
```

#### Customer
```
Purpose: Clinic clients who own pets and receive services
Relationships: has one User (optional), has many Pets, Visits, Billings, Invoices, Prescriptions
Indexes: phone (unique), email, status, name (trigram for search)
Constraints: phone unique, user_id optional unique
Lifecycle: Created by staff, soft-deletable (status = INACTIVE)
Ownership: All staff can read, Owner/Doctor/Cashier can create/edit
```

#### Pet
```
Purpose: Animals belonging to customers
Relationships: belongs to Customer, has many Visits, Billings, Invoices, Prescriptions
Indexes: customer_id, species, status, name
Constraints: customer_id required
Lifecycle: Created by staff or customer, soft-deletable (status = ARCHIVED)
Ownership: Linked customer owns the pet
```

#### Service
```
Purpose: Medical procedures and treatments with fixed pricing (master data)
Relationships: has many VisitItems, BillingItems
Indexes: name (unique), category, status, price
Constraints: name unique, price >= 0
Lifecycle: Created by Owner, archivable (status = ARCHIVED)
Ownership: Owner manages fully, Doctor can select for visits
```

#### Drug
```
Purpose: Medications with fixed per-unit pricing (master data)
Relationships: has many VisitItems, BillingItems, PrescriptionItems
Indexes: name (unique), status, price_per_unit
Constraints: name unique, unit immutable after creation
Lifecycle: Created by Owner, archivable (status = ARCHIVED)
Ownership: Owner manages fully, Doctor can select for visits
```

#### Product
```
Purpose: Retail items for POS sales (master data)
Relationships: belongs to ProductCategory, has many PosOrderItems, BillingItems, StockAdjustments
Indexes: name (unique), category_id, status, barcode, current_stock
Constraints: name unique, category_id required, current_stock >= 0
Lifecycle: Created by Owner, archivable (status = ARCHIVED)
Ownership: Owner manages fully, Cashier can sell via POS
```

#### ProductCategory
```
Purpose: Classification for retail products
Relationships: has many Products
Indexes: name (unique), status
Constraints: name unique, cannot delete with active products
Lifecycle: Created by Owner, soft-deletable (status = ARCHIVED)
Ownership: Owner manages fully
```

#### Visit
```
Purpose: Single clinic visit with medical notes and treatment items
Relationships: belongs to Customer, Pet, User (created_by), has many VisitItems, has one Invoice, has one Prescription
Indexes: customer_id, pet_id, visit_date, status, visit_number (unique), created_by
Constraints: visit_number unique, status valid enum
Lifecycle: DRAFT -> COMPLETED -> PAID. Created by Doctor, editable only in DRAFT
Ownership: Created by Doctor, viewable by all staff
```

#### VisitItem
```
Purpose: Line items (services or drugs) attached to a visit
Relationships: belongs to Visit, references Service OR Drug
Indexes: visit_id, item_type, service_id, drug_id
Constraints: visit_id required, exactly one of service_id or drug_id must be set, quantity >= 1, unit_price >= 0
Lifecycle: Created with visit, deleted with visit (CASCADE)
Ownership: Belongs to parent visit
```

#### Billing
```
Purpose: Extended care record for hospitalization or pet hotel
Relationships: belongs to Customer, Pet, User (created_by), has many BillingItems, has one Invoice
Indexes: customer_id, pet_id, status, billing_number (unique), created_by
Constraints: billing_number unique, status valid enum
Lifecycle: OPEN -> COMPLETED -> PAID/SETTLED
Ownership: Created by Doctor/Cashier, managed by Owner
```

#### BillingItem
```
Purpose: Line items (services, drugs, or products) attached to a billing record
Relationships: belongs to Billing, references Service OR Drug OR Product
Indexes: billing_id, item_type
Constraints: billing_id required, exactly one of service_id, drug_id, or product_id must be set
Lifecycle: Added while billing OPEN, immutable after COMPLETED
Ownership: Belongs to parent billing
```

#### Invoice
```
Purpose: Financial document generated from visit or billing completion
Relationships: belongs to Customer, optional Pet, has many InvoiceItems, has many Payments
Indexes: customer_id, invoice_number (unique), status, invoice_date, source_type + source_id
Constraints: invoice_number unique, source_type valid enum, status valid enum
Lifecycle: UNPAID -> PARTIAL -> PAID. Immutable after PAID.
Ownership: Auto-generated, managed by Cashier for payment processing
```

#### InvoiceItem
```
Purpose: Line items on an invoice (snapshot of services, drugs, products at time of generation)
Relationships: belongs to Invoice
Indexes: invoice_id
Constraints: invoice_id required, quantity >= 1, unit_price >= 0
Lifecycle: Created with invoice, immutable
Ownership: Belongs to parent invoice
```

#### Prescription
```
Purpose: Drug prescription generated from visit
Relationships: belongs to Visit, Customer, Pet, has many PrescriptionItems
Indexes: visit_id, customer_id, prescription_number (unique), prescription_date
Constraints: prescription_number unique
Lifecycle: ACTIVE -> COMPLETED/CANCELLED
Ownership: Auto-generated from visit
```

#### PrescriptionItem
```
Purpose: Individual drug entries in a prescription
Relationships: belongs to Prescription, references Drug
Indexes: prescription_id, drug_id
Constraints: prescription_id required, drug_id required, quantity >= 1
Lifecycle: Created with prescription, deleted with prescription (CASCADE)
Ownership: Belongs to parent prescription
```

#### PosOrder
```
Purpose: Retail point-of-sale transaction
Relationships: optional Customer, has many PosOrderItems
Indexes: order_number (unique), customer_id, created_at, status
Constraints: order_number unique, total >= 0
Lifecycle: COMPLETED (created and completed atomically)
Ownership: Created by Cashier
```

#### PosOrderItem
```
Purpose: Product line items in a POS order
Relationships: belongs to PosOrder, references Product
Indexes: pos_order_id, product_id
Constraints: pos_order_id required, product_id required, quantity >= 1
Lifecycle: Created with order, immutable after completion
Ownership: Belongs to parent order
```

#### Payment
```
Purpose: Payment records against any payable source
Relationships: belongs to User (received_by)
Indexes: payment_number (unique), payable_type + payable_id, status, created_at
Constraints: payment_number unique, amount > 0, payable_type valid enum
Lifecycle: PENDING -> PAID/FAILED. Cannot be deleted.
Ownership: Created by Cashier, irreversibly recorded
```

#### StockAdjustment
```
Purpose: Manual stock change records for audit trail
Relationships: belongs to Product, belongs to User (created_by)
Indexes: product_id, created_at, reason
Constraints: product_id required, quantity != 0
Lifecycle: Created once, immutable
Ownership: Created by Owner/Admin
```

#### AuditLog
```
Purpose: System audit trail for critical operations
Relationships: belongs to User (optional)
Indexes: user_id, model_type + model_id, action, created_at
Constraints: model_type + model_id indexed for lookups
Lifecycle: Created once, immutable, rolling 12-month retention
Ownership: System-managed
```

#### Notification
```
Purpose: In-app notifications for users
Relationships: belongs to User
Indexes: user_id, is_read, created_at
Constraints: user_id required, auto-expire after 7 days
Lifecycle: Created on event, auto-deleted after 7 days
Ownership: System-managed, user marks as read
```

#### Setting
```
Purpose: System configuration key-value store
Relationships: None (standalone)
Indexes: key (unique)
Constraints: key unique, value is JSON
Lifecycle: Created by Owner, updatable
Ownership: Owner manages all settings
```

---

## 11. UI ARCHITECTURE

### 11.1 Design System

#### Color Palette
- Primary: hsl(221, 83%, 53%) - Blue
- Secondary: hsl(142, 71%, 45%) - Green
- Destructive: hsl(0, 84%, 60%) - Red
- Warning: hsl(38, 92%, 50%) - Amber
- Muted: hsl(220, 14%, 96%) - Light Gray
- Background: hsl(0, 0%, 100%) - White
- Foreground: hsl(224, 71%, 4%) - Near Black
- Card: hsl(0, 0%, 100%) - White
- Accent: hsl(220, 14%, 96%) - Light Gray

#### Typography
- Font: Inter (Google Fonts)
- H1: 36px, font-weight 800
- H2: 30px, font-weight 700
- H3: 24px, font-weight 600
- H4: 20px, font-weight 600
- Body: 16px, font-weight 400
- Small: 14px, font-weight 400
- Caption: 12px, font-weight 400

#### Spacing
- Use Tailwind spacing scale (4px increments)

#### Breakpoints
- Mobile: 0 - 639px (default)
- Tablet: 640px - 1023px (sm, md)
- Desktop: 1024px+ (lg, xl, 2xl)

### 11.2 Component Library

All components sourced from shadcn/ui with project-specific customizations:

| Component | Usage |
|---|---|
| Button | All actions (primary, secondary, destructive, ghost, link variants) |
| Card | Content containers, dashboard widgets, stat cards |
| Dialog | Modal forms, confirmations |
| AlertDialog | Destructive action confirmations |
| DropdownMenu | Action menus, navigation |
| Input | Text, number, search fields |
| Select | Dropdown selections |
| Textarea | Long text inputs |
| Form | Form wrapper with validation |
| Label | Form labels |
| Table | Data display with sort, filter, pagination |
| Tabs | Content organization |
| Badge | Status indicators, tags |
| Alert | Messages, warnings, errors |
| Toast | Success/error notifications |
| Skeleton | Loading states |
| Sheet | Side panels, mobile navigation |
| Avatar | User profile images |
| Separator | Visual dividers |
| Command | Search, command palette |
| Popover | Tooltips, dropdowns |
| Calendar | Date picker |
| Checkbox | Multi-select, boolean toggles |
| RadioGroup | Single-select options |
| Switch | Toggle settings |
| Tooltip | Hover information |
| Breadcrumb | Navigation trail |
| Pagination | List navigation |
| ScrollArea | Scrollable containers |

### 11.3 Layout Architecture

#### Admin/Staff Layout
```
┌─────────────────────────────────────────────────┐
│ TOP NAVBAR                                      │
│ [Logo] [Search] [Notifications] [User Menu]     │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ SIDEBAR  │ MAIN CONTENT                         │
│          │ (Server Component with Suspense)     │
│ Dashboard│                                      │
│ Visits   │                                      │
│ Billing  │                                      │
│ POS      │                                      │
│ Reports  │                                      │
│ ──────── │                                      │
│ Master   │                                      │
│ Services │                                      │
│ Drugs    │                                      │
│ Products │                                      │
│ Stock    │                                      │
│ ──────── │                                      │
│ Users    │                                      │
│ Settings │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

#### Customer Portal Layout
```
┌─────────────────────────────────────────────────┐
│ TOP NAVBAR                                      │
│ [Logo] [Notifications] [Profile Menu]           │
├─────────────────────────────────────────────────┤
│                                                 │
│ MAIN CONTENT (Full Width)                       │
│ (Server Component with Suspense)                │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### POS Layout
```
┌─────────────────────────────────────────────────┐
│ TOP NAVBAR                                      │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│ PRODUCT CATALOG      │ CART                     │
│ [Search/Scan]        │                          │
│                      │ Items list               │
│ Category filters     │ Subtotal                 │
│ Product grid/list    │ Tax                      │
│                      │ Discount                 │
│                      │ Total                    │
│                      │                          │
│                      │ [Pay] [Clear]            │
└──────────────────────┴──────────────────────────┘
```

### 11.4 Responsive Behavior

| Viewport | Admin Sidebar | POS | Portal |
|---|---|---|---|
| Desktop (1024px+) | Visible, collapsible | Side-by-side | Full width |
| Tablet (640-1023px) | Collapsed to icons | Stacked | Full width |
| Mobile (<640px) | Hidden, hamburger trigger | Stacked, full-width | Full width |

---

## 12. SCREEN SPECIFICATIONS

### 12.1 Login Page
- **Route:** /login
- **Actor:** All users
- **Layout:** Centered card on background
- **Components:** Email input, password input, remember me checkbox, submit button, forgot password link
- **Validation:** Email format, required fields
- **Loading:** Button spinner during submission
- **Error:** Inline error messages for invalid credentials
- **Success:** Redirect to role-appropriate dashboard

### 12.2 Owner Dashboard
- **Route:** /dashboard
- **Actor:** Owner
- **Layout:** Stats cards row, charts section, pending actions list, recent transactions table
- **Components:** Stat cards (4), line chart (visits 7d), bar chart (revenue 30d), data table (recent transactions), alert cards (pending items)
- **Loading:** Skeleton placeholders for all sections
- **Empty:** "No data yet" message
- **Responsive:** Stats stack vertically on mobile, charts full-width

### 12.3 Customer List
- **Route:** /customers
- **Actor:** Owner, Doctor, Cashier
- **Layout:** Toolbar + data table
- **Components:** Search input, status filter, create button, data table (name, phone, email, pets count, status, actions), pagination
- **Validation:** Search debounced (300ms)
- **Loading:** Table skeleton rows
- **Empty:** "No customers found" with create CTA
- **Responsive:** Table converts to card list on mobile

### 12.4 Customer Detail
- **Route:** /customers/[id]
- **Actor:** Owner, Doctor, Cashier
- **Layout:** Profile card + tabs (Pets, Visits, Invoices)
- **Components:** Avatar, info display, edit button, pet cards, visit list, invoice list
- **Loading:** Skeleton for all sections
- **Empty:** "No pets/visits/invoices" per tab
- **Responsive:** Tabs convert to accordion on mobile

### 12.5 Customer Form (Create/Edit)
- **Route:** /customers/new, /customers/[id]/edit
- **Actor:** Owner, Doctor, Cashier
- **Layout:** Single column form
- **Components:** Name input, phone input, email input, address textarea, save button, cancel button
- **Validation:** Name required, phone required and unique, email optional and valid format
- **Loading:** Button spinner during save
- **Error:** Inline validation messages
- **Success:** Redirect to customer detail with success toast

### 12.6 Pet Form (Create/Edit)
- **Route:** /customers/[id]/pets/new, /pets/[id]/edit
- **Actor:** Owner, Doctor, Cashier, Customer (portal)
- **Layout:** Single column form
- **Components:** Name input, species select, breed input, birth date picker, weight input, color input, medical history textarea, save button
- **Validation:** Name required, species required
- **Loading:** Button spinner during save
- **Error:** Inline validation messages
- **Success:** Redirect to pet detail with success toast

### 12.7 Visit List
- **Route:** /visits
- **Actor:** Owner, Doctor, Cashier
- **Layout:** Toolbar + data table
- **Components:** Search input, status filter, date range picker, create button, data table (visit number, date, customer, pet, status, actions), pagination
- **Loading:** Table skeleton rows
- **Empty:** "No visits found" with create CTA
- **Responsive:** Table converts to card list on mobile

### 12.8 Visit Form (Create/Edit)
- **Route:** /visits/new, /visits/[id]/edit
- **Actor:** Doctor
- **Layout:** Multi-section form
- **Sections:**
  1. Customer Selection (search autocomplete)
  2. Pet Selection (dropdown, filtered by customer)
  3. Visit Info (date, time, chief complaint, diagnosis, physical exam notes, treatment notes, vital signs)
  4. Services Selection (searchable multi-select from master list)
  5. Drug Selection (searchable multi-select with quantity input from master list)
  6. Action buttons (Save Draft, Complete Visit)
- **Validation:** Customer required, pet required, chief complaint required, diagnosis required, at least 1 service or drug selected
- **Loading:** Button spinner, search debounced
- **Error:** Inline validation, toast for server errors
- **Success:** Redirect to visit detail with success toast
- **Business Rules:** Prices displayed from master data, read-only to doctor

### 12.9 Visit Detail
- **Route:** /visits/[id]
- **Actor:** Owner, Doctor, Cashier
- **Layout:** Header card + sections
- **Components:** Visit info display, customer/pet info, services list, drugs list, diagnosis display, treatment notes, invoice link (if generated), action buttons (edit if DRAFT, complete if DRAFT, print)
- **Loading:** Skeleton for all sections
- **Responsive:** Sections stack on mobile

### 12.10 Billing List
- **Route:** /billings
- **Actor:** Owner, Doctor, Cashier
- **Layout:** Toolbar + data table
- **Components:** Search input, status filter, create button, data table (billing number, customer, pet, start date, items count, total, status, actions), pagination
- **Loading:** Table skeleton rows
- **Empty:** "No billings found"

### 12.11 Billing Detail
- **Route:** /billings/[id]
- **Actor:** Owner, Doctor, Cashier
- **Layout:** Header + items list + actions
- **Components:** Billing info, customer/pet info, add item button, items table (type, name, quantity, price, subtotal, notes), running total, complete button, invoice link
- **Loading:** Skeleton
- **Business Rules:** Add items only while OPEN, complete transitions to COMPLETED

### 12.12 POS Page
- **Route:** /pos
- **Actor:** Cashier
- **Layout:** Two-column (catalog left, cart right)
- **Components:** Product search input, category filter tabs, product grid (name, price, stock, add button), cart items list, subtotal/tax/discount/total display, payment method select, payment amount input, discount input, pay button, clear button
- **Loading:** Product grid skeleton
- **Error:** Insufficient stock warning, payment validation
- **Success:** Receipt modal with print/email options
- **Responsive:** Stacked on mobile

### 12.13 Invoice List
- **Route:** /invoices
- **Actor:** Owner, Cashier
- **Layout:** Toolbar + data table
- **Components:** Search input, status filter, date range picker, data table (invoice number, customer, date, total, paid, status, actions), pagination
- **Loading:** Table skeleton

### 12.14 Invoice Detail
- **Route:** /invoices/[id]
- **Actor:** Owner, Cashier
- **Layout:** Printable invoice view
- **Components:** Clinic header, invoice number, customer info, pet info, items table, subtotal, tax, discount, total, paid amount, remaining, payment history, action buttons (print, email, process payment)
- **Loading:** Skeleton
- **Responsive:** Full-width printable

### 12.15 Master Data - Services
- **Route:** /master/services
- **Actor:** Owner
- **Layout:** Toolbar + data table
- **Components:** Search input, category filter, create button, data table (name, category, price, status, usage count, actions), pagination, create/edit dialog
- **Loading:** Table skeleton
- **Validation:** Name required and unique, price required and >= 0, category required

### 12.16 Master Data - Drugs
- **Route:** /master/drugs
- **Actor:** Owner
- **Layout:** Toolbar + data table
- **Components:** Search input, create button, data table (name, unit, price, status, usage count, actions), pagination, create/edit dialog
- **Loading:** Table skeleton
- **Validation:** Name required and unique, unit required, price required and >= 0

### 12.17 Master Data - Products
- **Route:** /master/products
- **Actor:** Owner
- **Layout:** Toolbar + data table
- **Components:** Search input, category filter, create button, data table (name, category, price, stock, reorder point, status, actions), pagination, create/edit dialog
- **Loading:** Table skeleton
- **Validation:** Name required and unique, category required, price required and >= 0

### 12.18 Stock Management
- **Route:** /master/stock
- **Actor:** Owner, Admin
- **Layout:** Toolbar + data table
- **Components:** Search input, low stock filter, data table (product, category, current stock, reorder point, status, adjust button), stock adjustment dialog, movement history link
- **Loading:** Table skeleton
- **Validation:** Adjustment quantity required, reason required

### 12.19 User Management
- **Route:** /settings/users
- **Actor:** Owner
- **Layout:** Toolbar + data table
- **Components:** Search input, role filter, create button, data table (name, email, role, status, last login, actions), pagination, create/edit dialog
- **Loading:** Table skeleton
- **Validation:** Name required, email required and unique, role required

### 12.20 Settings
- **Route:** /settings
- **Actor:** Owner
- **Layout:** Tabbed sections
- **Tabs:** Company Info, Tax Configuration, Payment Methods, Numbering Format
- **Components:** Form fields per tab, save button per section
- **Loading:** Form skeleton

### 12.21 Reports
- **Route:** /reports
- **Actor:** Owner
- **Layout:** Tabbed report views
- **Tabs:** Daily, Revenue, Inventory, Customers, Payments
- **Components:** Date pickers, filter selects, data tables, charts, export buttons (CSV)
- **Loading:** Chart skeletons, table skeletons

### 12.22 Customer Portal - Dashboard
- **Route:** /portal/dashboard
- **Actor:** Customer
- **Layout:** Welcome section, pet cards, recent visits, unpaid invoices
- **Components:** Greeting text, pet quick-access cards, visit timeline, invoice alerts
- **Loading:** Skeleton
- **Empty:** "No visits yet" message

### 12.23 Customer Portal - My Pets
- **Route:** /portal/pets
- **Actor:** Customer
- **Layout:** Pet cards grid
- **Components:** Pet cards (name, species, breed, age, weight), add pet button, pet detail link
- **Loading:** Skeleton cards
- **Empty:** "No pets yet" with add CTA

### 12.24 Customer Portal - Visit History
- **Route:** /portal/visits
- **Actor:** Customer
- **Layout:** Filter bar + visit list
- **Components:** Pet filter, date range picker, status filter, visit cards (date, pet, diagnosis, status, actions), visit detail link
- **Loading:** Skeleton cards
- **Empty:** "No visits yet"

### 12.25 Customer Portal - Invoices
- **Route:** /portal/invoices
- **Actor:** Customer
- **Layout:** Invoice list
- **Components:** Invoice cards (number, date, total, status, download button), filter by status
- **Loading:** Skeleton cards
- **Empty:** "No invoices yet"

### 12.26 Customer Portal - Prescriptions
- **Route:** /portal/prescriptions
- **Actor:** Customer
- **Layout:** Prescription list
- **Components:** Prescription cards (number, date, drug list, download button)
- **Loading:** Skeleton cards
- **Empty:** "No prescriptions yet"

### 12.27 Customer Portal - Profile
- **Route:** /portal/profile
- **Actor:** Customer
- **Layout:** Profile form
- **Components:** Name input, phone input, email input, address textarea, save button, change password section
- **Validation:** Name required, phone required and unique, email valid format
- **Loading:** Form skeleton

---

## 13. NAVIGATION SPECIFICATION

### 13.1 Admin/Staff Sidebar Navigation

| Section | Items | Roles |
|---|---|---|
| Overview | Dashboard | Owner |
| Operations | Customers, Visits, Billing, POS | Owner, Doctor, Cashier |
| Finance | Invoices, Payments | Owner, Cashier |
| Reports | All Reports | Owner |
| Master Data | Services, Drugs, Products, Stock | Owner |
| Administration | Users, Settings | Owner |

### 13.2 Customer Portal Navigation

| Items | Roles |
|---|---|
| Dashboard, My Pets, Visit History, Invoices, Prescriptions, Profile | Customer |

### 13.3 Navigation Behavior
- Sidebar collapses to icons on tablet
- Sidebar hidden with hamburger menu on mobile
- Active item highlighted
- Section dividers between logical groups
- User avatar and role displayed at bottom of sidebar
- Logout button in user menu

---

## 14. BACKEND ARCHITECTURE

### 14.1 Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
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
│   │   ├── billings/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── pos/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── master/
│   │   │   ├── services/page.tsx
│   │   │   ├── drugs/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   └── stock/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── users/page.tsx
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
│   │   │   ├── invoices/page.tsx
│   │   │   ├── prescriptions/page.tsx
│   │   │   └── profile/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── upload/route.ts
│   │   └── health/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── server/
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── customers.ts
│   │   ├── pets.ts
│   │   ├── visits.ts
│   │   ├── billings.ts
│   │   ├── pos.ts
│   │   ├── invoices.ts
│   │   ├── payments.ts
│   │   ├── prescriptions.ts
│   │   ├── services.ts
│   │   ├── drugs.ts
│   │   ├── products.ts
│   │   ├── stock.ts
│   │   ├── users.ts
│   │   ├── settings.ts
│   │   ├── reports.ts
│   │   ├── notifications.ts
│   │   └── uploads.ts
│   ├── queries/
│   │   ├── customers.ts
│   │   ├── pets.ts
│   │   ├── visits.ts
│   │   ├── billings.ts
│   │   ├── pos.ts
│   │   ├── invoices.ts
│   │   ├── payments.ts
│   │   ├── prescriptions.ts
│   │   ├── services.ts
│   │   ├── drugs.ts
│   │   ├── products.ts
│   │   ├── stock.ts
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
│   │   ├── billing-form.tsx
│   │   ├── service-form.tsx
│   │   ├── drug-form.tsx
│   │   ├── product-form.tsx
│   │   ├── stock-adjustment-form.tsx
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
│   │   └── invoice-card.tsx
│   ├── charts/
│   │   ├── visits-chart.tsx
│   │   └── revenue-chart.tsx
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

### 14.2 Server Actions Design

All mutations use Server Actions. Route Handlers used only for: file upload, health check, and auth callbacks.

#### Action Pattern

Every Server Action follows this structure:
1. Input: Zod-validated typed input
2. Auth check: Verify session and role
3. Business logic: Execute with Prisma transaction where needed
4. Audit log: Record the action
5. Return: Typed result with success/error

#### Example: createVisit

```
Input:
- customer_id: string (validated UUID)
- pet_id: string (validated UUID)
- chief_complaint: string (required)
- diagnosis: string (required)
- physical_exam_notes: string (optional)
- treatment_notes: string (optional)
- weight_kg: number (optional)
- temperature: number (optional)
- heart_rate: number (optional)
- services: Array<{ service_id: string, quantity: number }> (min 1 combined with drugs)
- drugs: Array<{ drug_id: string, quantity: number }> (min 1 combined with services)

Output:
- success: boolean
- data?: { visit_id: string, visit_number: string }
- error?: { message: string, field?: string }

Validation:
- customer_id must reference existing customer
- pet_id must reference existing pet belonging to customer
- At least 1 service or drug selected
- All service/drug IDs must reference existing active records
- Quantity >= 1 for each item

Authorization:
- Role must be Doctor

Business Rules:
- Visit number auto-generated: VIS-YYYY-MMDD-XXXXX
- Prices captured from master data at time of creation
- Status defaults to DRAFT
- created_by set to current user

Transaction:
- Single Prisma transaction: create visit + all visit items

Audit:
- Log: VISIT_CREATED with customer_id, pet_id, item count
```

### 14.3 Server Action Reference

#### Auth Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| login | email, password | Public | Max 5 attempts, 30min lockout |
| logout | none | Authenticated | Clear session |
| forgotPassword | email | Public | Send reset email if account exists |
| resetPassword | token, email, password | Public | Token valid for 24h |

#### Customer Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createCustomer | name, phone, email?, address? | Owner, Doctor, Cashier | Phone unique, auto-create portal account |
| updateCustomer | id, name?, phone?, email?, address? | Owner, Doctor, Cashier | Phone unique if changed |
| archiveCustomer | id | Owner | Cannot archive with active visits |

#### Pet Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createPet | customer_id, name, species, breed?, birth_date?, weight_kg?, color?, medical_notes? | Owner, Doctor, Cashier, Customer (own) | Customer must exist |
| updatePet | id, fields... | Owner, Doctor, Cashier, Customer (own) | Cannot edit archived pet |
| archivePet | id | Owner, Doctor, Cashier, Customer (own) | Soft delete only |

#### Visit Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createVisit | customer_id, pet_id, chief_complaint, diagnosis, ...items | Doctor | Prices from master, status DRAFT |
| updateVisit | id, fields... | Doctor (own, DRAFT only) | Only DRAFT visits editable |
| addVisitItem | visit_id, item_type, item_id, quantity | Doctor (own, DRAFT only) | Only DRAFT |
| removeVisitItem | visit_id, item_id | Doctor (own, DRAFT only) | Only DRAFT |
| completeVisit | id | Doctor (own, DRAFT only) | Auto-generate invoice + prescription |

#### Billing Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createBilling | customer_id, pet_id, notes? | Owner, Doctor | Status OPEN |
| addBillingItem | billing_id, item_type, item_id, quantity, notes? | Owner, Doctor, Cashier | Only OPEN billing |
| removeBillingItem | billing_id, item_id | Owner, Doctor | Only OPEN billing |
| completeBilling | id | Owner, Doctor | Auto-generate invoice |

#### POS Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createPosOrder | customer_id? | Cashier | Optional customer |
| addPosItem | order_id, product_id, quantity | Cashier | Stock check required |
| removePosItem | order_id, item_id | Cashier | Before checkout only |
| checkoutPos | order_id, payment_method, payment_amount, discount? | Cashier | Payment >= total, stock deducted |

#### Invoice Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getInvoice | id | Owner, Cashier, Customer (own) | Read-only |
| downloadInvoicePdf | id | Owner, Cashier, Customer (own) | Generate PDF on demand |
| emailInvoice | id | Owner, Cashier | Send via Resend |

#### Payment Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| processPayment | invoice_id, payment_method, amount | Cashier | Amount >= remaining balance |

#### Master Data Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createService | name, description, category, price | Owner | Name unique, price >= 0 |
| updateService | id, fields... | Owner | Price change affects new visits only |
| archiveService | id | Owner | Soft delete |
| createDrug | name, description, unit, price_per_unit | Owner | Name unique, unit immutable |
| updateDrug | id, fields... (except unit) | Owner | Unit cannot change |
| archiveDrug | id | Owner | Soft delete |
| createProduct | name, category_id, price, description?, image?, barcode?, reorder_point? | Owner | Name unique |
| updateProduct | id, fields... | Owner | -- |
| archiveProduct | id | Owner | Soft delete |
| createProductCategory | name, description? | Owner | Name unique |
| updateProductCategory | id, name?, description? | Owner | -- |
| archiveProductCategory | id | Owner | Cannot archive with active products |

#### Stock Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| adjustStock | product_id, quantity, reason, notes? | Owner, Admin | Creates StockAdjustment record |

#### User Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| createUser | name, email, phone?, role_id | Owner | Email unique |
| updateUser | id, fields... | Owner | -- |
| disableUser | id | Owner | Cannot disable self |
| resetUserPassword | id | Owner | Generate temp password, send email |

#### Settings Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| updateCompanyInfo | name, logo?, address, phone, email, ... | Owner | -- |
| updateTaxConfig | type, value, enabled | Owner | -- |
| updatePaymentMethods | methods[] | Owner | At least 1 active (Cash) |
| updateNumberingFormat | invoice_prefix?, receipt_prefix?, ... | Owner | -- |

#### Notification Actions
| Action | Input | Authorization | Business Rules |
|---|---|---|---|
| getNotifications | none | Authenticated | Return user's notifications |
| markAsRead | notification_id | Authenticated | Owner of notification only |
| markAllAsRead | none | Authenticated | -- |

### 14.4 Route Handler Reference

| Route | Method | Purpose |
|---|---|---|
| /api/auth/[...nextauth] | GET/POST | Auth.js handlers |
| /api/upload | POST | File upload to Supabase Storage |
| /api/health | GET | Health check endpoint |

---

## 15. VALIDATION RULES

### 15.1 Shared Validation Schemas (Zod)

All validation defined as Zod schemas in shared location, used by both Server Actions and client forms.

| Entity | Required Fields | Constraints |
|---|---|---|
| Customer | name, phone, address | phone: unique, 10-20 digits, name: 1-255 chars |
| Pet | name, species | name: 1-255 chars, species: enum, weight: >= 0 |
| Visit | customer_id, pet_id, chief_complaint, diagnosis | chief_complaint: 1+ chars, diagnosis: 1+ chars |
| VisitItem | item_type, item_id, quantity | quantity: >= 1, item_id must exist and be active |
| Billing | customer_id, pet_id | -- |
| BillingItem | item_type, item_id, quantity | quantity: >= 1 |
| Service | name, category, price | name: 1-100 chars, unique, price: >= 0 |
| Drug | name, unit, price_per_unit | name: 1-100 chars, unique, price: >= 0 |
| Product | name, category_id, price | name: 1-100 chars, unique, price: >= 0, category must exist |
| ProductCategory | name | name: 1-100 chars, unique |
| PosOrderItem | product_id, quantity | quantity: >= 1, product must exist and have stock |
| Payment | invoice_id, payment_method, amount | amount: > 0, must cover remaining balance |
| User | name, email, role_id | email: valid, unique, role must exist |
| Setting | key, value | key: unique |

### 15.2 Business Logic Validation

- Cannot create visit for non-existent customer or pet
- Cannot complete billing with zero items
- Cannot process payment exceeding invoice amount (for visit/billing)
- Cannot modify completed or paid transactions
- Cannot apply archived service, drug, or product
- Stock cannot go negative
- At least 1 payment method must be active
- Doctor cannot modify prices
- Cashier cannot modify master data
- Only Owner can configure system settings
- Customer can only access own data in portal

---

## 16. ERROR HANDLING

### 16.1 Error Response Format

All Server Actions return:
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

### 16.2 Error Types

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

### 16.3 Error Display
- Inline field errors below form inputs
- Toast notifications for server-level errors
- Error boundaries for component-level errors
- 404 page for not-found routes
- 500 page for server errors

---

## 17. AUDIT TRAIL

### 17.1 Tracked Actions
- All CREATE, UPDATE, DELETE on master data (services, drugs, products, categories)
- All visit creation, completion, and payment
- All billing creation, item addition, completion, and payment
- All POS transactions
- All payment processing
- All user management actions (create, update, disable, password reset)
- All settings changes
- All stock adjustments

### 17.2 Audit Record Fields
- user_id (who performed the action)
- action (CREATE, UPDATE, DELETE, ARCHIVE, PAYMENT, STATUS_CHANGE)
- entity_type (model name)
- entity_id (record ID)
- changes (JSON: { field: { old: value, new: value } })
- ip_address
- user_agent
- timestamp

### 17.3 Retention
- Rolling 12-month retention
- Older records archived (not deleted)
- Owner can view audit logs for any entity

---

## 18. NOTIFICATION SYSTEM

### 18.1 Email Notifications (Resend)

| Event | Recipient | Template |
|---|---|---|
| Customer registered | Owner | new-customer.html |
| Visit completed | Customer | visit-completed.html |
| Invoice generated | Customer | invoice-generated.html |
| Payment received | Customer | payment-received.html |
| Low stock alert | Owner | low-stock.html |
| Daily summary | Owner | daily-summary.html |

Email templates use clinic branding from settings. Plain text fallback included.

### 18.2 In-App Notifications

Stored in Notification table. Displayed via notification bell component.

| Event | Recipient | Type |
|---|---|---|
| New customer registered | Owner | info |
| Visit completed | Customer | info |
| Invoice generated | Customer | info |
| Payment received | Customer | success |
| Low stock | Owner | warning |
| Unpaid invoice reminder | Owner, Cashier | warning |

Auto-dismiss after 7 days via scheduled cleanup.

---

## 19. FILE STORAGE

### 19.1 Supabase Storage

| Bucket | Purpose | Access |
|---|---|---|
| avatars | User profile images | Public read, authenticated write |
| products | Product images | Public read, owner write |
| clinic | Clinic logo | Public read, owner write |
| documents | Generated PDFs (invoices, prescriptions) | Authenticated read, system write |
| uploads | General file uploads | Authenticated read/write |

### 19.2 Upload Constraints
- Maximum file size: 5MB
- Allowed types: jpg, jpeg, png, webp, pdf
- Files stored with UUID-based names to prevent conflicts
- Original filename preserved in metadata

### 19.3 Security
- RLS policies on all buckets
- Upload authenticated via server-side only
- File type validation server-side
- No direct client upload to storage

---

## 20. SEARCH STRATEGY

### 20.1 Database Search
- Customer search: trigram index on name, exact match on phone
- Product search: trigram index on name, exact match on barcode
- Service/Drug search: trigram index on name
- Full PostgreSQL LIKE with ILIKE for simple searches

### 20.2 Search Implementation
- Debounced search input (300ms delay)
- Server-side search via Server Actions
- Results paginated (20 per page)
- Search term highlighted in results

---

## 21. PERFORMANCE STRATEGY

### 21.1 Rendering
- React Server Components for all data-fetching pages (zero client JS for data)
- Client Components only for interactive elements (forms, dialogs, charts)
- Streaming with Suspense for progressive loading
- Static generation for public pages where applicable

### 21.2 Data Fetching
- Server Components fetch data directly (no API overhead)
- TanStack Query for client-side data that requires caching/refetching
- Optimistic updates for mutations (UI updates before server confirmation)
- Prefetching on hover/focus for navigation

### 21.3 Database
- Prisma query optimization (select only needed fields)
- Eager loading for all relationships (prevent N+1)
- Database indexes on all frequently queried columns
- Connection pooling via Supabase

### 21.4 Frontend
- Tailwind CSS purging unused styles
- Dynamic imports for heavy components (charts, PDF viewer)
- Image optimization via Next.js Image component
- Font optimization via next/font

### 21.5 Caching
- Browser caching via Cache-Control headers
- Next.js ISR for semi-static pages
- Server Component response caching
- TanStack Query stale-while-revalidate for client data

### 21.6 Targets
- Initial page load: < 2 seconds
- Navigation: < 1 second
- Lighthouse score: >= 80
- Time to Interactive: < 3 seconds

---

## 22. SECURITY STRATEGY

### 22.1 Authentication
- Auth.js session-based authentication
- Bcrypt password hashing (12 rounds)
- CSRF protection via Auth.js built-in
- Secure cookie flags (httpOnly, secure, sameSite)
- Session timeout: 12 hours

### 22.2 Authorization
- Server-side role verification in every Server Action
- Middleware-based route protection
- Component-level role checks for UI rendering
- No sensitive data exposed to unauthorized roles

### 22.3 Data Protection
- All database queries via Prisma (parameterized, no SQL injection)
- React auto-escaping (no XSS in rendered output)
- Input validation via Zod at every entry point
- HTTPS enforced in production
- Environment variables for all secrets (never committed to git)

### 22.4 File Upload Security
- Server-side file type validation
- File size limits enforced
- UUID-based file naming (prevent path traversal)
- Storage bucket RLS policies

### 22.5 Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- API routes: 100 requests per minute per IP
- File uploads: 10 per minute per user

### 22.6 Audit
- All mutations logged with user, action, entity, changes
- IP address and user agent captured
- 12-month retention

---

## 23. TESTING STRATEGY

### 23.1 Unit Tests (Vitest)
- All server utility functions
- Zod validation schemas
- Number generation functions
- Tax calculation functions
- Date formatting utilities
- **Coverage target: > 80% for business logic**

### 23.2 Integration Tests (Vitest)
- Server Actions with mocked Prisma
- API Route Handlers
- Auth flows
- Authorization checks

### 23.3 E2E Tests (Playwright)
- Complete visit workflow (create -> complete -> pay)
- POS transaction flow
- Billing workflow
- Customer portal flows
- Login/logout flows
- CRUD operations for master data
- Permission enforcement
- Responsive layouts

### 23.4 Test Organization
```
tests/
├── unit/
│   ├── lib/
│   │   ├── numbers.test.ts
│   │   ├── tax.test.ts
│   │   └── validators.test.ts
│   └── server/
│       └── actions/
├── integration/
│   ├── server/
│   │   └── actions/
│   └── api/
└── e2e/
    ├── auth.spec.ts
    ├── visits.spec.ts
    ├── pos.spec.ts
    ├── billing.spec.ts
    ├── customers.spec.ts
    ├── portal.spec.ts
    └── master-data.spec.ts
```

---

## 24. DEPLOYMENT STRATEGY

### 24.1 Target Stack
- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Email:** Resend
- **CI/CD:** GitHub Actions
- **Repository:** GitHub

### 24.2 Deployment Pipeline

```
GitHub Push (main branch)
    ↓
GitHub Actions
    ↓
Install Dependencies (pnpm install)
    ↓
Lint & Type Check (pnpm lint && pnpm typecheck)
    ↓
Run Tests (pnpm test)
    ↓
Build Next.js (pnpm build)
    ↓
Vercel Preview (PR) / Production (main)
    ↓
Vercel Build
    ↓
Prisma Generate
    ↓
Prisma Migrate Deploy (supabase CLI)
    ↓
Health Check
    ↓
Deploy Complete
```

If any step fails, deployment stops with clear error notification.

### 24.3 Database Bootstrap

Executed automatically on first deployment and on schema changes:

```
1. prisma generate
2. prisma migrate deploy
3. Run seed script (idempotent):
   - Seed roles (Owner, Doctor, Cashier, Admin)
   - Seed permissions
   - Seed role-permission mappings
   - Seed default services (Konsultasi, Vaksin RABIES, Grooming, etc.)
   - Seed default drugs (Amoxicillin, Paracetamol, etc.)
   - Seed default product categories (Food, Medicine, Accessories, etc.)
   - Seed default payment methods (Cash)
   - Seed default settings (company info, tax config, numbering format)
4. Bootstrap Supabase Storage:
   - Create buckets (avatars, products, clinic, documents, uploads)
   - Set bucket policies (public read for avatars/products/clinic)
   - Set RLS policies
5. Health check
```

Seed script is idempotent: skips existing records, inserts only missing ones.

### 24.4 Supabase Bootstrap

Bootstrap process ensures:
- Storage buckets exist with correct policies
- RLS policies are active on all tables
- Database extensions enabled (uuid-ossp, pg_trgm)
- Default data seeded
- Indexes created via Prisma migrations

All operations are idempotent and safe to re-run.

### 24.5 Environment Variables

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

### 24.6 Development Setup

```bash
# Clone repository
git clone <repo-url>
cd klinik-hewan

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Configure .env with local values
# - DATABASE_URL: local PostgreSQL or Supabase
# - NEXTAUTH_SECRET: generate random string
# - NEXTAUTH_URL: http://localhost:3000
# - Other variables as needed

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database
pnpm prisma db seed

# Start development server
pnpm dev
```

Application available at http://localhost:3000.

---

## 25. MONITORING STRATEGY

### 25.1 Application Monitoring
- Vercel Analytics for performance metrics
- Vercel Speed Insights for Core Web Vitals
- Custom /api/health endpoint for uptime monitoring

### 25.2 Error Tracking
- Vercel Error Tracking for server errors
- Client-side error boundaries with error logging
- Structured logging for all Server Action errors

### 25.3 Logging
- Server Action logs: timestamp, action, user_id, entity, result
- Error logs: timestamp, error type, stack trace, context
- Audit logs: stored in database (AuditLog table)
- No sensitive data in logs (passwords, tokens)

### 25.4 Alerts
- Deployment failure notifications via GitHub
- Error rate spike detection
- Database connection issues

---

## 26. DISASTER RECOVERY

### 26.1 Backup Strategy
- **Database:** Supabase automatic daily backups (retention per plan)
- **Storage:** Supabase handles storage redundancy
- **Code:** GitHub repository (distributed)
- **Environment Variables:** Stored in Vercel (encrypted), backed up in .env.example with placeholders

### 26.2 Recovery Procedures
1. **Database Recovery:** Restore from Supabase backup dashboard
2. **Application Recovery:** Redeploy from GitHub main branch
3. **Storage Recovery:** Supabase handles replication
4. **Full Recovery:** Clone repo, configure env, run migrations, restore database backup

### 26.3 RPO and RTO
- **RPO (Recovery Point Objective):** 24 hours (daily backups)
- **RTO (Recovery Time Objective):** 1 hour (redeploy + restore)

---

## 27. CODING STANDARDS

### 27.1 TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types on all functions
- Interface names: PascalCase, no `I` prefix
- Type exports from types/ directory

### 27.2 React Components
- Functional components only
- Server Components by default
- Client Components only when state/effects needed
- File naming: kebab-case for files, PascalCase for components
- One component per file
- Props interfaces defined in same file

### 27.3 Server Actions
- Named exports (not default)
- "use server" directive at top of file
- Zod validation before any database operation
- Auth check before business logic
- Audit logging after successful mutations
- Consistent return type (ActionResult)

### 27.4 Prisma
- Schema-first approach
- Migrations for all schema changes
- Use `select` to limit returned fields
- Use `include` for required relations
- Transactions for multi-step mutations
- Soft deletes via status field (no hard deletes on business data)

### 27.5 File Naming
- Pages: page.tsx
- Layouts: layout.tsx
- Components: kebab-case.tsx
- Server Actions: camelCase.ts
- Utilities: camelCase.ts
- Types: camelCase.ts
- Tests: *.test.ts (unit/integration), *.spec.ts (e2e)

### 27.6 CSS
- Tailwind CSS only
- No inline styles
- No CSS modules
- shadcn/ui components for consistency
- Responsive design via Tailwind breakpoints

---

## 28. NAMING CONVENTIONS

### 28.1 Database
- Tables: snake_case, plural (customers, visit_items)
- Columns: snake_case (created_at, customer_id)
- Indexes: idx_[table]_[column] (idx_customers_phone)
- Foreign keys: [referenced_table]_id (customer_id)
- Enums: UPPER_SNAKE_CASE (ACTIVE, IN_PROGRESS)

### 28.2 Code
- Variables: camelCase (customerName, visitDate)
- Functions: camelCase (createVisit, processPayment)
- Components: PascalCase (CustomerForm, VisitCard)
- Types/Interfaces: PascalCase (Customer, VisitItem)
- Constants: UPPER_SNAKE_CASE (MAX_LOGIN_ATTEMPTS)
- Files: kebab-case (customer-form.tsx, visit-card.tsx)

### 28.3 Routes
- Pages: /section/entity (e.g., /customers, /visits/new)
- Actions: /api/section/entity (internal, not exposed)
- Parameters: [id] (dynamic segments)

---

## 29. ACCEPTANCE CRITERIA

### 29.1 Authentication
- [ ] User can log in with email and password
- [ ] Invalid credentials show clear error message
- [ ] Account locks after 5 failed attempts for 30 minutes
- [ ] Password reset sends email with valid link
- [ ] Session expires after 12 hours of inactivity
- [ ] Logout clears session

### 29.2 Customer Management
- [ ] Staff can create customer with name, phone, address
- [ ] Phone number is unique across all customers
- [ ] Duplicate phone number shows validation error
- [ ] Staff can edit customer profile
- [ ] Staff can view customer with all pets
- [ ] Customer portal account auto-created on registration

### 29.3 Pet Management
- [ ] Staff can add pet to customer with name, species, breed
- [ ] Customer can add pet via portal
- [ ] Pet archived (not deleted) when removed
- [ ] Archived pets hidden from selection dropdowns

### 29.4 Visit Workflow
- [ ] Doctor can create visit with customer, pet, complaint, diagnosis
- [ ] Doctor can select multiple services and drugs
- [ ] Prices are captured from master data at time of selection
- [ ] Doctor cannot modify service or drug prices
- [ ] Visit saves as DRAFT
- [ ] Doctor can complete visit
- [ ] Invoice auto-generated on visit completion
- [ ] Prescription auto-generated from drug items
- [ ] DRAFT visits are editable, COMPLETED visits are not

### 29.5 Billing
- [ ] Staff can create billing for customer and pet
- [ ] Staff can add services, drugs, products to billing
- [ ] Items can be added while billing is OPEN
- [ ] Billing can be completed to generate invoice
- [ ] Completed billing items are immutable

### 29.6 POS
- [ ] Cashier can search and add products
- [ ] Stock is checked before adding to cart
- [ ] Subtotal, tax, discount, and total calculate correctly
- [ ] Payment processed with correct change calculation
- [ ] Stock decreases on order completion
- [ ] Receipt generated with unique number
- [ ] Insufficient stock shows error and prevents sale

### 29.7 Payment
- [ ] Payment recorded against correct invoice
- [ ] Invoice status updates correctly (UNPAID -> PAID)
- [ ] Partial payments recorded correctly
- [ ] Payment cannot exceed invoice total
- [ ] Payments cannot be deleted

### 29.8 Master Data
- [ ] Owner can CRUD services, drugs, products
- [ ] Archived items hidden from selection but visible in history
- [ ] Product categories cannot be deleted with active products
- [ ] Drug unit cannot be changed after creation
- [ ] Service price changes affect only new visits

### 29.9 Customer Portal
- [ ] Customer can log in and view dashboard
- [ ] Customer can view all pets
- [ ] Customer can view visit history with filtering
- [ ] Customer can view medical records per visit
- [ ] Customer can view and download invoices
- [ ] Customer can view and download prescriptions
- [ ] Customer can edit own profile
- [ ] Customer can add/edit pets
- [ ] Customer cannot access other customers' data

### 29.10 Reports
- [ ] Owner can view daily report with correct totals
- [ ] Owner can view revenue report with date filtering
- [ ] Owner can view inventory report with stock levels
- [ ] Owner can view customer report with activity data
- [ ] Reports can be exported as CSV

### 29.11 Notifications
- [ ] Email sent on visit completion
- [ ] Email sent on invoice generation
- [ ] Email sent on payment confirmation
- [ ] Low stock alert sent to Owner
- [ ] In-app notifications displayed in bell component
- [ ] Notifications marked as read on click

### 29.12 Security
- [ ] Unauthorized users cannot access protected routes
- [ ] Doctors cannot access master data management
- [ ] Cashiers cannot modify services, drugs, or products
- [ ] Customers cannot access other customers' data
- [ ] All form inputs validated server-side
- [ ] Audit trail recorded for all mutations

### 29.13 Deployment
- [ ] Application builds without errors
- [ ] Database migrations run successfully
- [ ] Seed data inserted on first deploy
- [ ] Storage buckets created with correct policies
- [ ] Health check endpoint returns 200
- [ ] All environment variables documented and functional

---

**END OF DOCUMENT**
