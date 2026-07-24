# HALAND PETCARE - PRD OVERVIEW

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
