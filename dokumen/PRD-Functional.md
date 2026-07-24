# HALAND PETCARE - FUNCTIONAL REQUIREMENTS

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

**END OF DOCUMENT**
