# HALAND PETCARE - WORKFLOWS & BUSINESS LOGIC

**Version:** 2.0
**Date:** 2026-07-23
**Status:** Production Specification

---

## 1. AUTHENTICATION & AUTHORIZATION WORKFLOWS

### 1.1 Login Workflow

**State:** `NOT_AUTHENTICATED` → `AUTHENTICATED`

```
1. User navigates to /login
2. User enters email + password
3. System validates input (Zod schema)
4. System checks account lockout:
   IF failed_attempts >= 5 AND lockout_until > now():
     → Return error: "Account locked. Try again in X minutes"
     → Log: AUTH_LOCKOUT
5. System queries User by email:
   IF user not found:
     → Increment failed_attempts
     → Return error: "Invalid email or password"
     → Log: AUTH_FAILED (no user found)
6. System verifies password (bcrypt compare):
   IF password invalid:
     → Increment failed_attempts
     → IF failed_attempts >= 5:
       → Set lockout_until = now() + 30 minutes
       → Log: AUTH_LOCKOUT_TRIGGERED
     → Return error: "Invalid email or password"
     → Log: AUTH_FAILED
7. System resets failed_attempts = 0
8. System creates Auth.js session
9. System logs last_login_at = now()
10. Redirect to role-appropriate dashboard:
    - Owner → /dashboard
    - Doctor → /dashboard
    - Cashier → /dashboard
    - Admin → /dashboard
    - Customer → /portal/dashboard
11. Log: AUTH_SUCCESS
```

**Edge Cases:**
- Concurrent login attempts: handled by Auth.js session management
- Session exists: redirect to dashboard without login form
- Remember me: extend session cookie lifetime

### 1.2 Password Reset Workflow

**State:** `REQUEST_RESET` → `EMAIL_SENT` → `TOKEN_VALID` → `PASSWORD_CHANGED`

```
1. User clicks "Forgot Password" on /login
2. System shows email input form
3. User submits email
4. System validates email format
5. System queries User by email:
   IF user found:
     → Generate crypto-random token
     → Store token + expiry (now + 24h) in password_reset_tokens table
     → Send email via Resend with reset link: /reset-password?token=xxx&email=xxx
     → Return success: "If account exists, reset email sent"
   IF user not found:
     → Return same success message (prevent email enumeration)
6. User clicks link in email
7. System validates token:
   IF token expired OR not found:
     → Show error: "Reset link expired. Request a new one."
8. System shows new password form (password + confirm password)
9. User submits new password
10. System validates password rules:
    - Minimum 8 characters
    - Must contain uppercase (A-Z)
    - Must contain lowercase (a-z)
    - Must contain number (0-9)
11. System hashes password (bcrypt, 12 rounds)
12. System updates User.password_hash
13. System deletes used token
14. System invalidates all existing sessions for this user
15. Redirect to /login with success message
16. Log: PASSWORD_RESET
```

### 1.3 Session Management

**State:** `ACTIVE` → `EXPIRED`

```
- Session timeout: 12 hours of inactivity
- On each request: Auth.js checks session validity
- IF session expired:
  → Clear session cookie
  → Redirect to /login
  → Log: SESSION_EXPIRED
- Logout:
  → Clear session cookie
  → Log: LOGOUT
```

### 1.4 Authorization Enforcement Workflow

```
FOR EVERY Server Action:
1. Get session from Auth.js
2. IF no session → return UNAUTHORIZED error
3. Get user role from session
4. IF role not in allowed_roles for this action:
   → Return FORBIDDEN error
   → Log: AUTHORIZATION_FAILED
5. Proceed with business logic

FOR EVERY page navigation:
1. Middleware checks route against role permissions
2. IF unauthorized → redirect to /login or appropriate dashboard
3. IF forbidden → show 403 page
```

---

## 2. CUSTOMER MANAGEMENT WORKFLOWS

### 2.1 Customer Registration Workflow

**State:** `ACTIVE` (default)

```
TRIGGER: Staff creates customer during walk-in

1. Doctor/Cashier navigates to /customers/new
2. Staff fills form: name, phone, email (optional), address
3. System validates input (Zod schema):
   - name: 1-255 chars, required
   - phone: 10-20 digits, required, unique
   - email: valid format, optional
   - address: required
4. System checks phone uniqueness:
   IF phone exists → return CONFLICT error
5. System creates Customer record:
   - status = ACTIVE
   - created_by = current user id
6. IF email provided:
   → Generate temporary password (random string)
   → Create User record with role = CUSTOMER
   → Link User to Customer via user_id
   → Hash temporary password (bcrypt)
   → Send welcome email with temporary password via Resend
7. Log: CUSTOMER_CREATED { name, phone, has_email }
8. Return: { customer_id, customer_name }
```

**Edge Cases:**
- Duplicate phone: return CONFLICT with field="phone"
- Email already used by another customer: return CONFLICT
- Phone format validation: digits only, 10-20 characters

### 2.2 Customer Update Workflow

**State:** `ACTIVE` → `ACTIVE` (no state change)

```
1. Staff navigates to /customers/[id]/edit
2. Staff modifies fields
3. System validates input
4. System checks phone uniqueness (if changed):
   IF phone exists for DIFFERENT customer → return CONFLICT
5. System updates Customer record
6. Log: CUSTOMER_UPDATED { changes: { field: { old, new } } }
7. Return: { customer_id }
```

### 2.3 Customer Archive Workflow

**State:** `ACTIVE` → `ARCHIVED`

```
TRIGGER: Owner archives customer

1. Owner clicks "Archive" on customer detail
2. System checks:
   IF customer has active visits (status IN [DRAFT, COMPLETED]):
     → Return error: "Cannot archive customer with active visits"
   IF customer has active billings (status IN [OPEN]):
     → Return error: "Cannot archive customer with active billings"
3. System updates Customer.status = ARCHIVED
4. System archives all associated Pets:
   → Pet.status = ARCHIVED
5. Log: CUSTOMER_ARCHIVED { customer_id }
6. Return: success
```

### 2.4 Pet Creation Workflow

**State:** `ACTIVE` (default)

```
TRIGGER: Staff or Customer creates pet

1. User navigates to /customers/[id]/pets/new (staff) or /portal/pets/new (customer)
2. User fills form: name, species, breed, birth_date, weight_kg, color, medical_notes
3. System validates input:
   - name: 1-255 chars, required
   - species: enum (DOG, CAT, BIRD, RABBIT, HAMSTER, OTHER), required
   - weight_kg: >= 0, optional
4. System verifies customer exists
5. FOR Customer role: verify customer_id matches current user's linked customer
6. System creates Pet record:
   - status = ACTIVE
   - customer_id = provided customer_id
7. Log: PET_CREATED { customer_id, species }
8. Return: { pet_id }
```

### 2.5 Pet Update Workflow

**State:** `ACTIVE` → `ACTIVE`

```
1. User edits pet
2. System validates input
3. System checks pet status:
   IF pet.status == ARCHIVED → return error: "Cannot edit archived pet"
4. FOR Customer role: verify pet belongs to user's customer record
5. System updates Pet record
6. Log: PET_UPDATED { pet_id, changes }
7. Return: { pet_id }
```

### 2.6 Pet Archive Workflow

**State:** `ACTIVE` → `ARCHIVED`

```
1. User clicks "Archive" on pet
2. System checks:
   IF pet has visits → can archive (soft delete only)
3. System updates Pet.status = ARCHIVED
4. Log: PET_ARCHIVED { pet_id }
5. Return: success
```

---

## 3. VISIT WORKFLOW

### 3.1 Visit State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │ completeVisit()
                         ▼
                    ┌──────────┐
                    │COMPLETED │
                    └────┬─────┘
                         │ processPayment()
                         ▼
                    ┌──────────┐
                    │   PAID   │
                    └──────────┘

EDITS ALLOWED: Only in DRAFT status
```

### 3.2 Visit Creation Workflow

**State:** `DRAFT` (initial)

```
TRIGGER: Doctor creates visit

1. Doctor navigates to /visits/new
2. Doctor searches customer (autocomplete, debounced 300ms)
3. Doctor selects customer
4. System loads customer's pets (filtered dropdown)
5. Doctor selects pet
6. Doctor fills visit info:
   - visit_date: date picker (default: today)
   - chief_complaint: required, 1+ chars
   - physical_exam_notes: optional
   - diagnosis: required, 1+ chars
   - treatment_notes: optional
   - weight_kg: optional, number
   - temperature: optional, number
   - heart_rate: optional, number
7. Doctor selects services from master list:
   - Searchable multi-select
   - Each service: { service_id, quantity }
   - Prices displayed (read-only, from Service.price)
8. Doctor selects drugs from master list:
   - Searchable multi-select
   - Each drug: { drug_id, quantity }
   - Prices displayed (read-only, from Drug.price_per_unit)
9. System validates:
   - customer_id exists and is ACTIVE
   - pet_id exists, belongs to customer, and is ACTIVE
   - At least 1 service OR drug selected
   - All item quantities >= 1
   - All referenced services/drugs are ACTIVE
10. System calculates subtotal:
    subtotal = SUM(service.price * quantity) + SUM(drug.price_per_unit * quantity)
11. System generates visit_number: VIS-YYYY-MMDD-XXXXX
12. System creates in Prisma transaction:
    - Visit record (status = DRAFT)
    - VisitItem records (snapshot prices from master data)
13. Log: VISIT_CREATED { customer_id, pet_id, item_count, subtotal }
14. Return: { visit_id, visit_number }
```

### 3.3 Visit Update Workflow

**State:** `DRAFT` → `DRAFT`

```
TRIGGER: Doctor updates DRAFT visit

1. Doctor navigates to /visits/[id]/edit
2. System checks visit.status:
   IF status != DRAFT → return error: "Only DRAFT visits can be edited"
3. Doctor modifies fields
4. Doctor can add/remove items
5. System revalidates all fields
6. System recalculates subtotal
7. System updates Visit and VisitItems in transaction
8. Log: VISIT_UPDATED { visit_id, changes }
9. Return: { visit_id }
```

### 3.4 Add Visit Item Workflow

**State:** `DRAFT` → `DRAFT`

```
1. Doctor adds service or drug to visit
2. System checks visit.status == DRAFT
3. System validates item exists and is ACTIVE
4. System captures price from master data at this moment
5. System creates VisitItem record
6. System recalculates subtotal
7. Log: VISIT_ITEM_ADDED { visit_id, item_type, item_id, quantity, price }
8. Return: success
```

### 3.5 Remove Visit Item Workflow

**State:** `DRAFT` → `DRAFT`

```
1. Doctor removes item from visit
2. System checks visit.status == DRAFT
3. System deletes VisitItem record
4. System recalculates subtotal
5. Log: VISIT_ITEM_REMOVED { visit_id, item_id }
6. Return: success
```

### 3.6 Visit Completion Workflow

**State:** `DRAFT` → `COMPLETED`

```
TRIGGER: Doctor completes visit

1. Doctor clicks "Complete Visit"
2. System checks visit.status == DRAFT
3. System validates:
   - At least 1 VisitItem exists
   - Diagnosis is not empty
4. System generates in Prisma transaction:
   a. Update Visit.status = COMPLETED
   
   b. Generate Invoice:
      - invoice_number: INV-YYYY-MMDD-XXXXX
      - source_type = VISIT
      - source_id = visit_id
      - customer_id, pet_id from visit
      - subtotal from visit
      - tax = calculateTax(subtotal) [from Settings]
      - discount = 0 (default)
      - total = subtotal + tax - discount
      - paid_amount = 0
      - status = UNPAID
      - invoice_date = now()
   
   c. Generate InvoiceItems:
      - FROM VisitItems: snapshot name, quantity, unit_price, subtotal, category
   
   d. Generate Prescription (if drug items exist):
      - prescription_number: RX-YYYY-MMDD-XXXXX
      - visit_id, customer_id, pet_id
      - status = ACTIVE
      - prescription_date = now()
   
   e. Generate PrescriptionItems:
      - FROM VisitItems where item_type = DRUG:
        drug_id, quantity, dosage (empty), duration (empty), instructions (empty)

5. Link Invoice to Visit:
   → Visit.invoice_id = invoice.id
6. Link Prescription to Visit:
   → Visit.prescription_id = prescription.id (if exists)

7. Notifications:
   a. In-app notification to Customer:
      - type = INFO
      - message = "Your visit has been completed. Invoice generated."
      - entity_type = VISIT, entity_id = visit_id
   
   b. Email to Customer (if email exists):
      - Template: visit-completed.html
      - Content: visit summary, invoice number, download link

8. Log: VISIT_COMPLETED { visit_id, invoice_id, prescription_id, total }
9. Return: { visit_id, invoice_id, prescription_id }
```

### 3.7 Visit Payment Workflow

**State:** `COMPLETED` → `PAID`

```
TRIGGER: Cashier processes payment for visit invoice

1. Cashier navigates to invoice detail
2. Cashier clicks "Process Payment"
3. System shows payment form:
   - payment_method: select from active methods
   - amount: input (default = remaining balance)
4. Cashier submits payment
5. System validates:
   - amount > 0
   - amount >= remaining_balance (total - paid_amount)
   - payment_method is active
6. System creates in Prisma transaction:
   a. Create Payment record:
      - payment_number: PAY-YYYY-MMDD-XXXXX
      - payable_type = INVOICE
      - payable_id = invoice_id
      - amount = provided amount
      - payment_method
      - received_by = current user id
      - status = PAID
   
   b. Update Invoice:
      - paid_amount += amount
      - IF paid_amount >= total:
        → status = PAID
      - ELSE:
        → status = PARTIAL
   
   c. Update Visit.status = PAID (if invoice fully paid)

7. IF fully paid:
   → In-app notification to Customer: "Payment confirmed for invoice {number}"
   → Email to Customer: payment-received.html

8. Log: PAYMENT_PROCESSED { invoice_id, amount, method, is_full_payment }
9. Return: { payment_id, invoice_status }
```

---

## 4. BILLING WORKFLOW

### 4.1 Billing State Machine

```
                    ┌──────┐
                    │ OPEN │
                    └──┬───┘
                       │ completeBilling()
                       ▼
                 ┌───────────┐
                 │ COMPLETED │
                 └─────┬─────'
                       │ processPayment()
                       ▼
              ┌────────────────┐
              │ PAID / SETTLED │
              └────────────────┘

ITEMS CAN BE ADDED: Only in OPEN status
```

### 4.2 Billing Creation Workflow

**State:** `OPEN` (initial)

```
TRIGGER: Staff creates billing for hospitalization/pet hotel

1. Staff navigates to /billings/new
2. Staff selects customer
3. Staff selects pet
4. System generates billing_number: BIL-YYYY-MMDD-XXXXX
5. System creates Billing record:
   - status = OPEN
   - customer_id, pet_id
   - created_by = current user id
6. Log: BILLING_CREATED { customer_id, pet_id }
7. Return: { billing_id, billing_number }
```

### 4.3 Add Billing Item Workflow

**State:** `OPEN` → `OPEN`

```
1. Staff adds item to billing
2. System checks billing.status == OPEN
3. Staff selects item_type (SERVICE, DRUG, or PRODUCT)
4. Staff selects item from master list
5. Staff enters quantity
6. System captures unit_price from master data at this moment
7. System validates:
   - item exists and is ACTIVE
   - quantity >= 1
   - For PRODUCT: check stock availability
8. System creates BillingItem:
   - item_type, item_id (service_id/drug_id/product_id)
   - quantity, unit_price, subtotal
   - notes (optional)
9. System recalculates billing running total
10. Log: BILLING_ITEM_ADDED { billing_id, item_type, item_id, quantity, price }
11. Return: success
```

### 4.4 Remove Billing Item Workflow

**State:** `OPEN` → `OPEN`

```
1. Staff removes item
2. System checks billing.status == OPEN
3. System deletes BillingItem
4. System recalculates running total
5. Log: BILLING_ITEM_REMOVED { billing_id, item_id }
6. Return: success
```

### 4.5 Billing Completion Workflow

**State:** `OPEN` → `COMPLETED`

```
TRIGGER: Staff completes billing

1. Staff clicks "Complete Billing"
2. System checks billing.status == OPEN
3. System validates:
   - At least 1 BillingItem exists
4. System generates in Prisma transaction:
   a. Update Billing.status = COMPLETED
   
   b. Generate Invoice:
      - invoice_number: INV-YYYY-MMDD-XXXXX
      - source_type = BILLING
      - source_id = billing_id
      - customer_id, pet_id from billing
      - subtotal = SUM(BillingItem.subtotal)
      - tax = calculateTax(subtotal)
      - discount = 0
      - total = subtotal + tax - discount
      - paid_amount = 0
      - status = UNPAID
      - invoice_date = now()
   
   c. Generate InvoiceItems:
      - FROM BillingItems: snapshot name, quantity, unit_price, subtotal, category

5. Link Invoice to Billing:
   → Billing.invoice_id = invoice.id

6. Log: BILLING_COMPLETED { billing_id, invoice_id, total }
7. Return: { billing_id, invoice_id }
```

### 4.6 Billing Payment Workflow

**State:** `COMPLETED` → `PAID/SETTLED`

```
1. Same as Visit Payment Workflow (Section 3.7)
2. Additional: Update Billing.status = PAID (if fully paid)
3. Log: BILLING_PAYMENT { billing_id, invoice_id, amount }
```

---

## 5. POS MODULE WORKFLOW

### 5.1 POS State Machine

```
    ┌──────────────────┐
    │   IN_PROGRESS    │
    │ (items in cart)  │
    └────────┬─────────┘
             │ checkoutPos()
             ▼
    ┌──────────────────┐
    │    COMPLETED     │
    │ (receipt issued) │
    └──────────────────┘

POS orders are created and completed atomically.
No intermediate persistence of cart state.
```

### 5.2 POS Transaction Workflow

**State:** `IN_PROGRESS` → `COMPLETED`

```
TRIGGER: Cashier processes retail sale

1. Cashier navigates to /pos
2. System shows product catalog + cart
3. Cashier optionally selects customer
4. Cashier searches/scans product (debounced 300ms)
5. Cashier adds product to cart:
   a. System validates:
      - Product exists and is ACTIVE
      - Product.current_stock >= requested quantity
   b. System captures price from Product.price
   c. Add to local cart state (client-side)
   d. Recalculate: subtotal

6. Repeat step 4-5 for additional products

7. Cashier optionally applies discount:
   - Type: FLAT or PERCENTAGE
   - Value: flat amount or percentage
   - System validates: discount <= subtotal
   - IF percentage: discount_amount = subtotal * (percentage / 100)
   - IF flat: discount_amount = flat value

8. System calculates:
   - subtotal = SUM(item.price * quantity)
   - tax_amount = calculateTax(subtotal - discount_amount)
   - total = subtotal - discount_amount + tax_amount

9. Cashier selects payment method
10. Cashier inputs payment amount
11. System validates:
    - payment_amount >= total
    - payment_method is active

12. System calculates change:
    - IF payment_method == CASH:
      change = payment_amount - total
    - ELSE:
      change = 0

13. Cashier clicks "Pay"
14. System creates in Prisma transaction:
    a. Create PosOrder:
       - order_number: RCP-YYYY-MMDD-XXXXX
       - customer_id (optional)
       - subtotal, tax_amount, discount_amount, discount_type, total
       - payment_method, payment_amount, change_amount
       - status = COMPLETED
       - created_by = current user id
    
    b. Create PosOrderItems:
       - product_id, quantity, unit_price, subtotal
    
    c. Update Product.current_stock:
       - current_stock -= quantity (for each item)
    
    d. Create StockAdjustment records:
       - product_id, quantity = -quantity, reason = SALE, reference = order_number
    
    e. Create Invoice (for POS):
       - invoice_number: INV-YYYY-MMDD-XXXXX
       - source_type = POS
       - source_id = pos_order_id
       - subtotal, tax, discount, total
       - paid_amount = payment_amount
       - status = PAID (POS is always paid immediately)
    
    f. Create Payment:
       - payment_number: PAY-YYYY-MMDD-XXXXX
       - payable_type = INVOICE
       - payable_id = invoice_id
       - amount = total
       - payment_method
       - status = PAID

15. Generate receipt (client-side or server-side)

16. Low stock check:
    FOR EACH product where current_stock < reorder_point:
      → In-app notification to Owner: "Low stock: {product_name}"
      → Email to Owner: low-stock.html

17. Log: POS_COMPLETED { order_id, total, item_count, payment_method }
18. Return: { order_id, receipt_number, change_amount }
```

**Edge Cases:**
- Insufficient stock: return INSUFFICIENT_STOCK error with available quantity
- Payment less than total: return INVALID_PAYMENT error
- Product archived: cannot add to cart
- Empty cart: cannot checkout

### 5.3 POS Stock Deduction Workflow

```
WITHIN POS TRANSACTION (atomic):
1. FOR EACH PosOrderItem:
   a. SELECT Product.current_stock FOR UPDATE (row lock)
   b. IF current_stock < quantity:
      → ABORT transaction
      → Return INSUFFICIENT_STOCK error
   c. UPDATE Product.current_stock = current_stock - quantity
   d. CREATE StockAdjustment:
      - product_id, quantity = -quantity
      - reason = SALE
      - reference = order_number
      - created_by = cashier user id
```

---

## 6. PAYMENT & INVOICING WORKFLOW

### 6.1 Invoice Lifecycle

```
UNPAID → PARTIAL → PAID

UNPAID: No payment received
PARTIAL: Some payment received (paid_amount < total)
PAID: Fully paid (paid_amount >= total)

IMMUTABLE: Once PAID, invoice cannot be modified
```

### 6.2 Invoice Generation Workflow

```
TRIGGERED BY: Visit completion OR Billing completion

1. System calculates:
   - subtotal = SUM(line items)
   - tax = from Settings (flat or percentage)
   - discount = 0 (default, can be set later)
   - total = subtotal + tax - discount
   - paid_amount = 0
   - status = UNPAID

2. System creates InvoiceItems:
   - Snapshot of all line items at generation time
   - Name, quantity, unit_price, subtotal, category

3. Invoice is immutable:
   - Cannot add/remove items
   - Cannot modify amounts
   - Only status can change (via payment)
```

### 6.3 Payment Processing Workflow

```
TRIGGER: Cashier processes payment

INPUT: invoice_id, payment_method, amount

VALIDATION:
1. Invoice exists and status != PAID
2. amount > 0
3. amount >= remaining_balance (total - paid_amount)
4. payment_method is active

PROCESSING:
1. Create Payment record
2. Update Invoice.paid_amount += amount
3. Update Invoice.status:
   - IF paid_amount >= total → PAID
   - ELSE → PARTIAL
4. IF source_type == VISIT:
   → Update Visit.status = PAID (if fully paid)
5. IF source_type == BILLING:
   → Update Billing.status = PAID (if fully paid)
6. Log: PAYMENT_PROCESSED
7. Send notifications (if fully paid)
```

### 6.4 Prescription Generation Workflow

```
TRIGGERED BY: Visit completion (if drug items exist)

1. System creates Prescription:
   - prescription_number: RX-YYYY-MMDD-XXXXX
   - visit_id, customer_id, pet_id
   - status = ACTIVE
   - prescription_date = now()

2. System creates PrescriptionItems:
   - FROM VisitItems where item_type = DRUG:
     - drug_id, quantity
     - dosage = "" (empty, to be filled later if needed)
     - duration = "" (empty)
     - instructions = "" (empty)

3. Prescription status: ACTIVE → COMPLETED/CANCELLED
   (No automatic status changes)
```

---

## 7. MASTER DATA CRUD WORKFLOWS

### 7.1 Service CRUD Workflow

**Create:**
```
1. Owner navigates to /master/services
2. Owner clicks "Create Service"
3. Owner fills: name, description, category, price
4. System validates:
   - name: 1-100 chars, unique
   - category: enum (CONSULTATION, VACCINATION, GROOMING, SURGERY, LABORATORY, XRAY, HOSPITALIZATION, OTHER)
   - price: >= 0
5. System checks name uniqueness:
   IF name exists → return CONFLICT
6. System creates Service:
   - status = ACTIVE
7. Log: SERVICE_CREATED { name, category, price }
8. Return: { service_id }
```

**Update:**
```
1. Owner edits service
2. System validates
3. IF name changed → check uniqueness
4. System updates Service
5. NOTE: Price change only affects new visits (historical data immutable)
6. Log: SERVICE_UPDATED { service_id, changes }
7. Return: { service_id }
```

**Archive:**
```
1. Owner archives service
2. System updates Service.status = ARCHIVED
3. Service hidden from selection dropdowns but remains in history
4. Log: SERVICE_ARCHIVED { service_id }
5. Return: success
```

### 7.2 Drug CRUD Workflow

**Create:**
```
1. Owner fills: name, description, unit, price_per_unit
2. System validates:
   - name: 1-100 chars, unique
   - unit: enum (TABLETS, CAPSULES, BOTTLE, VIAL, AMPULE, GRAM, ML, DROPS, OTHER)
   - price_per_unit: >= 0
3. System checks name uniqueness
4. System creates Drug:
   - status = ACTIVE
5. Log: DRUG_CREATED { name, unit, price_per_unit }
6. Return: { drug_id }
```

**Update:**
```
1. Owner edits drug
2. System validates
3. CONSTRAINT: unit CANNOT be changed after creation
4. IF unit field in update → ignore or return error
5. System updates Drug (except unit)
6. Log: DRUG_UPDATED { drug_id, changes }
7. Return: { drug_id }
```

**Archive:**
```
1. Owner archives drug
2. System updates Drug.status = ARCHIVED
3. Log: DRUG_ARCHIVED { drug_id }
4. Return: success
```

### 7.3 Product CRUD Workflow

**Create:**
```
1. Owner fills: name, category_id, price, description, image_url, barcode, reorder_point, current_stock
2. System validates:
   - name: 1-100 chars, unique
   - category_id: must exist and be ACTIVE
   - price: >= 0
   - current_stock: >= 0
   - reorder_point: >= 0
3. System checks name uniqueness
4. System creates Product:
   - status = ACTIVE
5. IF current_stock > 0:
   → Create StockAdjustment: quantity = current_stock, reason = INITIAL
6. Log: PRODUCT_CREATED { name, category_id, price, initial_stock }
7. Return: { product_id }
```

**Update:**
```
1. Owner edits product
2. System validates
3. System updates Product
4. Log: PRODUCT_UPDATED { product_id, changes }
5. Return: { product_id }
```

**Archive:**
```
1. Owner archives product
2. System checks:
   IF current_stock > 0:
     → Return error: "Cannot archive product with stock > 0. Adjust stock first."
3. System updates Product.status = ARCHIVED
4. Log: PRODUCT_ARCHIVED { product_id }
5. Return: success
```

### 7.4 Product Category CRUD Workflow

**Create:**
```
1. Owner fills: name, description
2. System validates: name 1-100 chars, unique
3. System checks name uniqueness
4. System creates ProductCategory:
   - status = ACTIVE
5. Log: CATEGORY_CREATED { name }
6. Return: { category_id }
```

**Archive:**
```
1. Owner archives category
2. System checks:
   IF category has ACTIVE products:
     → Return error: "Cannot archive category with active products"
3. System updates ProductCategory.status = ARCHIVED
4. Log: CATEGORY_ARCHIVED { category_id }
5. Return: success
```

---

## 8. STOCK MANAGEMENT WORKFLOW

### 8.1 Stock Adjustment Workflow

**State:** `IMMUTABLE` (adjustments are append-only)

```
TRIGGER: Owner/Admin performs manual stock opname

1. Owner/Admin navigates to /master/stock
2. Owner/Admin selects product
3. Owner/Admin clicks "Adjust Stock"
4. System shows adjustment form:
   - quantity: positive (add) or negative (subtract)
   - reason: required (text)
   - notes: optional
5. System validates:
   - product exists
   - quantity != 0
   - reason not empty
   - IF quantity < 0: |quantity| <= current_stock (cannot go negative)
6. System creates in Prisma transaction:
   a. Create StockAdjustment:
      - product_id, quantity, reason, notes
      - created_by = current user id
   
   b. Update Product.current_stock:
      - current_stock += quantity

7. IF new current_stock < reorder_point:
   → In-app notification to Owner
   → Email to Owner: low-stock.html

8. Log: STOCK_ADJUSTED { product_id, quantity, reason, new_stock }
9. Return: { adjustment_id, new_stock }
```

### 8.2 POS Stock Deduction (see Section 5.3)

### 8.3 Low Stock Alert Workflow

```
TRIGGERED BY: After any stock change (POS sale or manual adjustment)

1. System checks: IF Product.current_stock < Product.reorder_point:
   a. In-app notification to all Owner users:
      - type = WARNING
      - message = "Low stock alert: {product_name} has {current_stock} units (reorder point: {reorder_point})"
   
   b. Email to Owner:
      - Template: low-stock.html
      - Content: product name, current stock, reorder point

2. Low stock products highlighted in:
   - Dashboard widget
   - Stock management page (filter toggle)
   - Product list (red badge)
```

---

## 9. USER MANAGEMENT WORKFLOW

### 9.1 User Creation Workflow

**State:** `ACTIVE` (default)

```
TRIGGER: Owner creates user

1. Owner navigates to /settings/users
2. Owner clicks "Create User"
3. Owner fills: name, email, phone, role_id
4. System validates:
   - name: required
   - email: valid format, unique
   - role_id: must exist (OWNER, DOCTOR, CASHIER, ADMIN)
5. System checks email uniqueness
6. System generates temporary password
7. System hashes password (bcrypt)
8. System creates User:
   - status = ACTIVE
   - password_hash = hashed temp password
9. Send email with temp password via Resend
10. Log: USER_CREATED { email, role }
11. Return: { user_id }
```

### 9.2 User Update Workflow

**State:** `ACTIVE` → `ACTIVE`

```
1. Owner edits user
2. System validates
3. IF email changed → check uniqueness
4. System updates User
5. Log: USER_UPDATED { user_id, changes }
6. Return: { user_id }
```

### 9.3 User Disable Workflow

**State:** `ACTIVE` → `INACTIVE`

```
1. Owner disables user
2. System checks:
   IF user_id == current_user_id:
     → Return error: "Cannot disable your own account"
3. System updates User.status = INACTIVE
4. System invalidates all sessions for this user
5. Log: USER_DISABLED { user_id }
6. Return: success
```

### 9.4 Password Reset (Admin) Workflow

```
1. Owner clicks "Reset Password" on user
2. System generates new temporary password
3. System hashes password
4. System updates User.password_hash
5. System invalidates all sessions for this user
6. Send email with new temp password via Resend
7. Log: USER_PASSWORD_RESET { user_id }
8. Return: success
```

---

## 10. SETTINGS WORKFLOW

### 10.1 Company Info Update

```
1. Owner navigates to /settings
2. Owner edits company info
3. System validates all fields
4. System updates Settings table (key-value)
5. Log: SETTINGS_UPDATED { section: "company", changes }
6. Return: success
```

### 10.2 Tax Configuration Update

```
1. Owner edits tax config:
   - type: FLAT or PERCENTAGE
   - value: number >= 0
   - enabled: boolean
2. System validates
3. System updates Settings
4. NOTE: Tax changes apply to NEW transactions only
5. Log: SETTINGS_UPDATED { section: "tax", changes }
6. Return: success
```

### 10.3 Payment Method Configuration

```
1. Owner manages payment methods
2. Each method: name, status (active/inactive), instructions
3. CONSTRAINT: At least 1 method must be active (Cash)
4. IF deactivating last active method:
   → Return error: "At least 1 payment method must be active"
5. System updates Settings
6. Log: SETTINGS_UPDATED { section: "payment_methods", changes }
7. Return: success
```

---

## 11. NOTIFICATION WORKFLOWS

### 11.1 Email Notification Triggers

| Event | Recipient | Template | Trigger Point |
|---|---|---|---|
| Customer registered | Owner | new-customer.html | After createCustomer |
| Visit completed | Customer | visit-completed.html | After completeVisit |
| Invoice generated | Customer | invoice-generated.html | After completeVisit/completeBilling |
| Payment received | Customer | payment-received.html | After processPayment (full) |
| Low stock | Owner | low-stock.html | After stock < reorder_point |
| Daily summary | Owner | daily-summary.html | Scheduled (cron/daily) |

### 11.2 In-App Notification Triggers

| Event | Recipient | Type | Message |
|---|---|---|---|
| New customer | Owner | INFO | "New customer registered: {name}" |
| Visit completed | Customer | INFO | "Your visit has been completed" |
| Invoice generated | Customer | INFO | "Invoice {number} has been generated" |
| Payment received | Customer | SUCCESS | "Payment of {amount} confirmed" |
| Low stock | Owner | WARNING | "Low stock: {product} ({stock} units)" |
| Unpaid invoice | Owner, Cashier | WARNING | "Invoice {number} is unpaid for {days} days" |

### 11.3 Notification Lifecycle

```
1. Notification created on event
2. User sees notification bell with unread count
3. User clicks notification → marks as read
4. User can "Mark all as read"
5. Auto-cleanup: notifications older than 7 days deleted
```

---

## 12. AUDIT TRAIL WORKFLOW

### 12.1 Audit Log Creation

```
FOR EVERY mutation (Server Action):

1. After successful database operation
2. System creates AuditLog:
   - user_id = current user id
   - action = CREATE | UPDATE | DELETE | ARCHIVE | PAYMENT | STATUS_CHANGE
   - entity_type = model name (e.g., "Customer", "Visit")
   - entity_id = record ID
   - changes = JSON { field: { old: oldValue, new: newValue } }
   - ip_address = from request headers
   - user_agent = from request headers
   - timestamp = now()
3. AuditLog is immutable (no updates, no deletes)
```

### 12.2 Audit Log Retention

```
- Rolling 12-month retention
- Monthly cleanup job deletes records older than 12 months
- Archived (not deleted) to cold storage if needed
- Owner can view audit logs for any entity via UI
```

---

## 13. REPORTING WORKFLOWS

### 13.1 Daily Report

```
1. Owner navigates to /reports → Daily tab
2. Owner selects date (default: today)
3. System queries:
   - Total visits for date
   - Total revenue for date
   - Breakdown by service type
   - Top selling product
4. Display in charts and tables
5. Export option: CSV
```

### 13.2 Revenue Report

```
1. Owner selects date range
2. System queries:
   - Revenue by payment method
   - Revenue by service
   - Revenue by product
   - Growth comparison (vs previous period)
3. Display in charts and tables
4. Export option: CSV
```

### 13.3 Inventory Report

```
1. System queries:
   - All products with current stock levels
   - Low stock alerts (current_stock < reorder_point)
   - Stock movement history
2. Display in table with filters
3. Export option: CSV
```

### 13.4 Customer Report

```
1. System queries:
   - Visit frequency per customer
   - Last visit date
   - Total spend
   - Top customers by revenue
2. Display in table
3. Export option: CSV
```

### 13.5 Payment Report

```
1. System queries:
   - Unpaid invoices (aging analysis)
   - Payments by method
   - Reconciliation data
2. Display in table
3. Export option: CSV
```

---

## 14. CUSTOMER PORTAL WORKFLOWS

### 14.1 Portal Authentication

```
- Separate route group: /portal/*
- Customer logs in with email + password
- Session managed by Auth.js
- Customer can only access own data
- All data queries filtered by customer_id from session
```

### 14.2 Portal Data Access

```
FOR EVERY portal page:
1. Get customer_id from session (linked via User.customer_id)
2. Query data WHERE customer_id = session's customer_id
3. IF data belongs to different customer → return empty/error
4. NEVER expose other customers' data
```

### 14.3 Portal Pet Management

```
- Customer can view all own pets
- Customer can add new pet (linked to own customer_id)
- Customer can edit own pets
- Customer can archive own pets
- All operations verified against session customer_id
```

---

## 15. CROSS-MODULE INTEGRATION MAP

```
┌──────────────┐
│   Customer   │
└──────┬───────┘
       │
       ├──── creates ────→ ┌──────────┐
       │                   │   Pet    │
       │                   └────┬─────┘
       │                        │
       ├──── creates ────→ ┌────▼─────┐
       │                   │  Visit   │──── completeVisit() ────→ ┌───────────┐
       │                   └──────────┘                            │  Invoice  │
       │                                                          └─────┬─────┘
       ├──── creates ────→ ┌──────────┐                               │
       │                   │ Billing  │──── completeBilling() ───→ ┌────▼─────┐
       │                   └──────────┘                            │ Payment  │
       │                                                          └──────────┘
       │
       └──── linked to ──→ ┌──────────┐
                           │  Portal  │ (view-only access)
                           └──────────┘

┌──────────────┐
│    POS       │──── checkout() ────→ ┌──────────┐
└──────────────┘                       │  Stock   │ (deduction)
                                       └──────────┘

┌──────────────┐
│ Master Data  │──── prices snapshot ──→ Visit, Billing, POS
│ (Services,   │
│  Drugs,      │
│  Products)   │
└──────────────┘
```

---

## 16. COMPLETE AUDIT LOG MATRIX

| Module | Action | Audit Log Created |
|---|---|---|
| Auth | Login success | YES |
| Auth | Login failure | YES |
| Auth | Password reset | YES |
| Auth | Session expired | YES |
| Customer | Create | YES |
| Customer | Update | YES (with field changes) |
| Customer | Archive | YES |
| Pet | Create | YES |
| Pet | Update | YES (with field changes) |
| Pet | Archive | YES |
| Visit | Create | YES |
| Visit | Update | YES (with field changes) |
| Visit | Complete | YES |
| Visit Item | Add | YES |
| Visit Item | Remove | YES |
| Billing | Create | YES |
| Billing | Update | YES |
| Billing | Complete | YES |
| Billing Item | Add | YES |
| Billing Item | Remove | YES |
| POS | Checkout | YES |
| Payment | Process | YES |
| Service | Create | YES |
| Service | Update | YES (with field changes) |
| Service | Archive | YES |
| Drug | Create | YES |
| Drug | Update | YES (with field changes) |
| Drug | Archive | YES |
| Product | Create | YES |
| Product | Update | YES (with field changes) |
| Product | Archive | YES |
| Category | Create | YES |
| Category | Update | YES |
| Category | Archive | YES |
| Stock | Adjustment | YES |
| User | Create | YES |
| User | Update | YES (with field changes) |
| User | Disable | YES |
| User | Password reset | YES |
| Settings | Update | YES (with section) |

---

## 17. COMPLETE NOTIFICATION TRIGGER MATRIX

| Module | Event | Email | In-App | Recipient |
|---|---|---|---|---|
| Customer | Registered | YES | YES | Owner |
| Visit | Completed | YES | YES | Customer |
| Invoice | Generated | YES | YES | Customer |
| Payment | Received (full) | YES | YES | Customer |
| Stock | Low | YES | YES | Owner |
| POS | Low stock after sale | YES | YES | Owner |
| Report | Daily summary | YES | NO | Owner |
| Billing | Completed | YES | YES | Customer |

---

**END OF DOCUMENT**
