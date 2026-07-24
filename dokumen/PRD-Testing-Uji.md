# HALAND PETCARE - TESTING STRATEGY & ACCEPTANCE CRITERIA

**Version:** 2.0
**Date:** 2026-07-23
**Status:** Production Specification

---

## 1. TESTING PHILOSOPHY

### 1.1 Principles

- **Test the behavior, not the implementation**
- **Every business rule must have a corresponding test**
- **Every workflow must have an end-to-end test**
- **Every edge case must be covered in unit tests**
- **Tests are living documentation of the system**

### 1.2 Testing Pyramid

```
         ┌──────────┐
         │   E2E    │  ← Playwright (10%)
         │  Tests   │     Critical user flows
         ├──────────┤
         │Integration│  ← Vitest (30%)
         │  Tests   │     Server Actions, API routes
         ├──────────┤
         │  Unit    │  ← Vitest (60%)
         │  Tests   │     Utils, validators, logic
         └──────────┘
```

### 1.3 Coverage Targets

| Category | Target | Priority |
|---|---|---|
| Business logic (server utils) | > 90% | CRITICAL |
| Validation schemas | 100% | CRITICAL |
| Server Actions | > 85% | HIGH |
| API Route Handlers | > 80% | HIGH |
| E2E critical flows | 100% | CRITICAL |
| E2E secondary flows | > 80% | MEDIUM |

---

## 2. UNIT TESTING (Vitest)

### 2.1 Test File Structure

```
tests/unit/
├── lib/
│   ├── numbers.test.ts          # Auto-numbering functions
│   ├── tax.test.ts              # Tax calculation functions
│   ├── validators.test.ts       # Zod validation schemas
│   ├── utils.test.ts            # General utilities
│   └── errors.test.ts           # Error handling
├── server/
│   ├── actions/
│   │   ├── auth.test.ts         # Auth actions
│   │   ├── customers.test.ts    # Customer CRUD
│   │   ├── pets.test.ts         # Pet CRUD
│   │   ├── visits.test.ts       # Visit workflow
│   │   ├── billings.test.ts     # Billing workflow
│   │   ├── pos.test.ts          # POS workflow
│   │   ├── payments.test.ts     # Payment processing
│   │   ├── invoices.test.ts     # Invoice generation
│   │   ├── prescriptions.test.ts # Prescription generation
│   │   ├── services.test.ts     # Service CRUD
│   │   ├── drugs.test.ts        # Drug CRUD
│   │   ├── products.test.ts     # Product CRUD
│   │   ├── stock.test.ts        # Stock management
│   │   ├── users.test.ts        # User management
│   │   └── settings.test.ts     # Settings management
│   └── queries/
│       └── [entity].test.ts     # Query functions
└── components/
    └── [component].test.ts      # Component logic (if any)
```

### 2.2 Number Generation Tests

**File:** `tests/unit/lib/numbers.test.ts`

```
TEST: generateVisitNumber
  - Generates format VIS-YYYY-MMDD-XXXXX
  - Sequential numbering within day
  - Resets daily
  - Handles month/year boundary
  - Handles leap year

TEST: generateInvoiceNumber
  - Generates format INV-YYYY-MMDD-XXXXX
  - Sequential numbering

TEST: generatePrescriptionNumber
  - Generates format RX-YYYY-MMDD-XXXXX
  - Sequential numbering

TEST: generateBillingNumber
  - Generates format BIL-YYYY-MMDD-XXXXX
  - Sequential numbering

TEST: generateReceiptNumber
  - Generates format RCP-YYYY-MMDD-XXXXX
  - Sequential numbering

TEST: generatePaymentNumber
  - Generates format PAY-YYYY-MMDD-XXXXX
  - Sequential numbering
```

### 2.3 Tax Calculation Tests

**File:** `tests/unit/lib/tax.test.ts`

```
TEST: calculateTax (percentage)
  - Input: subtotal=100000, type=PERCENTAGE, value=10, enabled=true
  - Expected: 10000
  - Input: subtotal=0, type=PERCENTAGE, value=10, enabled=true
  - Expected: 0
  - Input: subtotal=100000, type=PERCENTAGE, value=0, enabled=true
  - Expected: 0

TEST: calculateTax (flat)
  - Input: subtotal=100000, type=FLAT, value=5000, enabled=true
  - Expected: 5000
  - Input: subtotal=1000, type=FLAT, value=5000, enabled=true
  - Expected: 5000 (flat tax not capped by subtotal)

TEST: calculateTax (disabled)
  - Input: subtotal=100000, type=PERCENTAGE, value=10, enabled=false
  - Expected: 0

TEST: calculateDiscount (flat)
  - Input: subtotal=100000, type=FLAT, value=10000
  - Expected: 10000

TEST: calculateDiscount (percentage)
  - Input: subtotal=100000, type=PERCENTAGE, value=10
  - Expected: 10000

TEST: calculateTotal
  - Input: subtotal=100000, tax=10000, discount=5000
  - Expected: 105000

TEST: calculateChange
  - Input: total=105000, payment=110000, method=CASH
  - Expected: 5000
  - Input: total=105000, payment=110000, method=BANK_TRANSFER
  - Expected: 0
```

### 2.4 Validation Schema Tests

**File:** `tests/unit/lib/validators.test.ts`

```
TEST: createCustomerSchema
  - Valid input passes
  - Missing name fails
  - Missing phone fails
  - Phone < 10 digits fails
  - Phone > 20 digits fails
  - Phone with letters fails
  - Missing address fails
  - Email optional (empty string valid)
  - Invalid email format fails

TEST: createPetSchema
  - Valid input passes
  - Missing name fails
  - Missing species fails
  - Invalid species enum fails
  - Weight < 0 fails
  - Weight = 0 valid

TEST: createVisitSchema
  - Valid input passes
  - Missing customer_id fails
  - Missing pet_id fails
  - Missing chief_complaint fails
  - Missing diagnosis fails
  - Empty services AND drugs fails

TEST: createServiceSchema
  - Valid input passes
  - Missing name fails
  - Name > 100 chars fails
  - Missing category fails
  - Invalid category enum fails
  - Price < 0 fails
  - Price = 0 valid

TEST: createDrugSchema
  - Valid input passes
  - Missing name fails
  - Missing unit fails
  - Invalid unit enum fails
  - Price < 0 fails

TEST: createProductSchema
  - Valid input passes
  - Missing name fails
  - Missing category_id fails
  - Price < 0 fails

TEST: processPaymentSchema
  - Valid input passes
  - Amount <= 0 fails
  - Missing invoice_id fails
  - Missing payment_method fails

TEST: checkoutPosSchema
  - Valid input passes
  - Empty items fails
  - Payment < total fails
```

### 2.5 Server Action Tests (with mocked Prisma)

**File:** `tests/unit/server/actions/customers.test.ts`

```
TEST: createCustomer
  - Happy path: creates customer with all fields
  - Phone uniqueness: returns CONFLICT for duplicate phone
  - Auto-creates User account when email provided
  - Sends welcome email when email provided
  - Does not send email when no email
  - Sets status = ACTIVE
  - Logs audit trail
  - Returns ActionResult with customer_id

TEST: updateCustomer
  - Happy path: updates customer fields
  - Phone uniqueness check (excludes self)
  - Logs audit trail with field changes

TEST: archiveCustomer
  - Happy path: archives customer
  - Fails if customer has active visits
  - Fails if customer has active billings
  - Archives associated pets
  - Logs audit trail
```

**File:** `tests/unit/server/actions/visits.test.ts`

```
TEST: createVisit
  - Happy path: creates visit with items
  - Validates customer exists
  - Validates pet belongs to customer
  - Validates at least 1 service or drug
  - Validates all item IDs exist and are ACTIVE
  - Snapshots prices from master data
  - Sets status = DRAFT
  - Generates visit_number
  - Creates in transaction (all or nothing)
  - Logs audit trail

TEST: updateVisit
  - Happy path: updates DRAFT visit
  - Fails if visit is not DRAFT
  - Validates all fields
  - Recalculates subtotal

TEST: addVisitItem
  - Happy path: adds item to DRAFT visit
  - Fails if visit is not DRAFT
  - Validates item exists and is ACTIVE
  - Snapshots price
  - Recalculates subtotal

TEST: removeVisitItem
  - Happy path: removes item from DRAFT visit
  - Fails if visit is not DRAFT
  - Recalculates subtotal

TEST: completeVisit
  - Happy path: completes visit, generates invoice + prescription
  - Fails if visit is not DRAFT
  - Fails if no items
  - Generates Invoice with correct totals
  - Generates InvoiceItems from VisitItems
  - Generates Prescription if drug items exist
  - Generates PrescriptionItems from drug VisitItems
  - Sets Visit.status = COMPLETED
  - Sends notifications
  - Creates in transaction
```

**File:** `tests/unit/server/actions/pos.test.ts`

```
TEST: addPosItem
  - Happy path: adds product to cart
  - Validates product exists and is ACTIVE
  - Validates stock availability
  - Fails if insufficient stock

TEST: checkoutPos
  - Happy path: completes POS transaction
  - Validates payment >= total
  - Deducts stock atomically
  - Creates StockAdjustment records
  - Creates Invoice and Payment
  - Generates receipt number
  - Checks low stock alerts
  - Creates in transaction
  - Fails if insufficient stock
  - Fails if payment < total
```

**File:** `tests/unit/server/actions/payments.test.ts`

```
TEST: processPayment
  - Happy path: processes full payment
  - Validates amount > 0
  - Validates amount >= remaining balance
  - Updates Invoice.paid_amount
  - Sets Invoice.status = PAID when fully paid
  - Sets Invoice.status = PARTIAL when partial
  - Updates Visit.status = PAID (if fully paid)
  - Updates Billing.status = PAID (if fully paid)
  - Creates Payment record
  - Sends notifications when fully paid
  - Logs audit trail
```

### 2.6 Error Handling Tests

**File:** `tests/unit/lib/errors.test.ts`

```
TEST: ActionResult type
  - Returns success: true with data
  - Returns success: false with error object
  - Error includes message, field, code

TEST: Error codes
  - UNAUTHORIZED
  - FORBIDDEN
  - NOT_FOUND
  - VALIDATION
  - CONFLICT
  - INSUFFICIENT_STOCK
  - INVALID_PAYMENT
  - BUSINESS_RULE
```

---

## 3. INTEGRATION TESTING

### 3.1 Test File Structure

```
tests/integration/
├── server/
│   ├── actions/
│   │   ├── auth.integration.test.ts
│   │   ├── customers.integration.test.ts
│   │   ├── visits.integration.test.ts
│   │   ├── billings.integration.test.ts
│   │   ├── pos.integration.test.ts
│   │   ├── payments.integration.test.ts
│   │   └── master-data.integration.test.ts
│   └── queries/
│       └── [entity].integration.test.ts
└── api/
    ├── auth.integration.test.ts
    ├── upload.integration.test.ts
    └── health.integration.test.ts
```

### 3.2 Integration Test Scenarios

#### Auth Integration
```
TEST: Login flow
  - Create user with hashed password
  - Login with correct credentials → success
  - Login with wrong password → failure
  - Login after 5 failures → locked out
  - Login after lockout expires → success

TEST: Password reset flow
  - Request reset → token created, email sent
  - Reset with valid token → password updated
  - Reset with expired token → error
  - Reset with used token → error
```

#### Customer Integration
```
TEST: Customer creation with portal account
  - Create customer with email → User created
  - Create customer without email → no User
  - Duplicate phone → CONFLICT

TEST: Customer archival
  - Archive customer → status ARCHIVED
  - Archive with active visits → error
  - Pets archived with customer
```

#### Visit Integration (full workflow)
```
TEST: Complete visit workflow
  - Create visit → DRAFT
  - Add items → items created
  - Update visit → fields updated
  - Complete visit → COMPLETED + Invoice + Prescription
  - Process payment → PAID
  - Verify Invoice status = PAID
  - Verify Visit status = PAID
  - Verify stock unchanged (no products in visit)
```

#### Billing Integration (full workflow)
```
TEST: Complete billing workflow
  - Create billing → OPEN
  - Add items → items created
  - Complete billing → COMPLETED + Invoice
  - Process payment → PAID
  - Verify Invoice status = PAID
  - Verify Billing status = PAID
```

#### POS Integration (full workflow)
```
TEST: Complete POS workflow
  - Create order
  - Add items → stock checked
  - Checkout → stock deducted
  - Verify Product.current_stock decreased
  - Verify Invoice created (PAID)
  - Verify Payment created
  - Verify StockAdjustment created
  - Insufficient stock → error
```

#### Master Data Integration
```
TEST: Service lifecycle
  - Create → ACTIVE
  - Update → fields changed
  - Archive → ARCHIVED
  - Archived service hidden from selection
  - Archived service visible in history

TEST: Drug lifecycle
  - Create → ACTIVE
  - Update (except unit) → fields changed
  - Update unit → error
  - Archive → ARCHIVED

TEST: Product lifecycle
  - Create → ACTIVE
  - Update → fields changed
  - Archive with stock=0 → ARCHIVED
  - Archive with stock>0 → error

TEST: Category lifecycle
  - Create → ACTIVE
  - Archive with no products → ARCHIVED
  - Archive with active products → error
```

### 3.3 Database Integration Tests

```
TEST: Prisma transactions
  - Multi-step operations atomically
  - Rollback on failure

TEST: Cascade behaviors
  - Customer delete → Pets cascade (soft)
  - Visit delete → VisitItems cascade
  - Billing delete → BillingItems cascade
  - Invoice delete → InvoiceItems cascade
  - Prescription delete → PrescriptionItems cascade
  - PosOrder delete → PosOrderItems cascade

TEST: Unique constraints
  - Email uniqueness
  - Phone uniqueness
  - Visit number uniqueness
  - Invoice number uniqueness
  - Prescription number uniqueness
  - Billing number uniqueness
  - Receipt number uniqueness
  - Payment number uniqueness

TEST: Foreign key constraints
  - Cannot create Visit for non-existent Customer
  - Cannot create VisitItem for non-existent Visit
  - Cannot create BillingItem for non-existent Billing
```

---

## 4. E2E TESTING (Playwright)

### 4.1 Test File Structure

```
tests/e2e/
├── auth.spec.ts           # Authentication flows
├── customers.spec.ts      # Customer management
├── visits.spec.ts         # Visit workflow
├── billing.spec.ts        # Billing workflow
├── pos.spec.ts            # POS workflow
├── payments.spec.ts       # Payment processing
├── master-data.spec.ts    # Master data CRUD
├── portal.spec.ts         # Customer portal
├── dashboard.spec.ts      # Owner dashboard
├── reports.spec.ts        # Reporting
├── settings.spec.ts       # Settings management
├── users.spec.ts          # User management
├── notifications.spec.ts  # Notification system
└── responsive.spec.ts     # Responsive layouts
```

### 4.2 Auth E2E Tests

**File:** `tests/e2e/auth.spec.ts`

```
TEST: Login page loads
  - Navigate to /login
  - Email input visible
  - Password input visible
  - Submit button visible

TEST: Successful login as Owner
  - Fill email + password
  - Click submit
  - Redirect to /dashboard
  - User menu shows "Owner"

TEST: Successful login as Doctor
  - Login as doctor
  - Redirect to /dashboard

TEST: Successful login as Cashier
  - Login as cashier
  - Redirect to /dashboard

TEST: Successful login as Customer
  - Login as customer
  - Redirect to /portal/dashboard

TEST: Invalid credentials
  - Fill wrong password
  - Click submit
  - Error message displayed
  - No redirect

TEST: Account lockout
  - Fail login 5 times
  - 6th attempt shows "Account locked"

TEST: Logout
  - Login
  - Click user menu → Logout
  - Redirect to /login
  - Cannot access /dashboard

TEST: Password reset
  - Click "Forgot Password"
  - Enter email
  - Success message shown
```

### 4.3 Customer E2E Tests

**File:** `tests/e2e/customers.spec.ts`

```
TEST: Customer list page
  - Navigate to /customers
  - Table shows customer data
  - Search input works (debounced)
  - Status filter works
  - Pagination works

TEST: Create customer
  - Click "Create Customer"
  - Fill form: name, phone, email, address
  - Submit
  - Redirect to customer detail
  - Success toast shown

TEST: Create customer - duplicate phone
  - Fill form with existing phone
  - Submit
  - Error: "Phone number already exists"

TEST: Edit customer
  - Navigate to customer detail
  - Click "Edit"
  - Modify name
  - Submit
  - Redirect to detail
  - Updated name shown

TEST: Archive customer
  - Navigate to customer detail
  - Click "Archive"
  - Confirm dialog
  - Customer archived
  - Status shows "Archived"

TEST: Archive customer with active visits
  - Navigate to customer with active visit
  - Click "Archive"
  - Error: "Cannot archive with active visits"

TEST: Customer detail - tabs
  - Navigate to customer detail
  - Pets tab shows pets
  - Visits tab shows visits
  - Invoices tab shows invoices

TEST: Add pet to customer
  - Navigate to customer detail
  - Click "Add Pet"
  - Fill form: name, species, breed
  - Submit
  - Pet appears in pets list
```

### 4.4 Visit E2E Tests

**File:** `tests/e2e/visits.spec.ts`

```
TEST: Visit list page
  - Navigate to /visits
  - Table shows visit data
  - Status filter works
  - Date range filter works
  - Create button visible (Doctor role)

TEST: Create visit (Doctor)
  - Login as Doctor
  - Navigate to /visits/new
  - Search and select customer
  - Select pet
  - Fill complaint, diagnosis
  - Select services
  - Select drugs with quantity
  - Click "Save Draft"
  - Redirect to visit detail
  - Status shows "DRAFT"

TEST: Create visit - validation
  - Submit without customer
  - Error: "Customer is required"
  - Submit without pet
  - Error: "Pet is required"
  - Submit without complaint
  - Error: "Chief complaint is required"
  - Submit without services and drugs
  - Error: "At least 1 service or drug required"

TEST: Edit DRAFT visit
  - Navigate to DRAFT visit
  - Click "Edit"
  - Modify complaint
  - Submit
  - Updated complaint shown

TEST: Cannot edit COMPLETED visit
  - Navigate to COMPLETED visit
  - No "Edit" button visible

TEST: Complete visit
  - Navigate to DRAFT visit with items
  - Click "Complete Visit"
  - Confirm dialog
  - Status changes to "COMPLETED"
  - Invoice link appears
  - Prescription link appears (if drugs selected)

TEST: Complete visit - no items
  - Navigate to DRAFT visit with no items
  - Click "Complete Visit"
  - Error: "Cannot complete visit with no items"

TEST: Visit payment flow
  - Navigate to COMPLETED visit
  - Click "Pay Invoice"
  - Fill payment amount
  - Select payment method
  - Submit
  - Invoice status changes to "PAID"
  - Visit status changes to "PAID"
```

### 4.5 POS E2E Tests

**File:** `tests/e2e/pos.spec.ts`

```
TEST: POS page loads
  - Login as Cashier
  - Navigate to /pos
  - Product catalog visible
  - Cart visible
  - Total shows 0

TEST: Add product to cart
  - Search product
  - Click "Add" button
  - Product appears in cart
  - Subtotal updates
  - Total updates (with tax)

TEST: Add product - insufficient stock
  - Search product with low stock
  - Add quantity > available
  - Error: "Insufficient stock"

TEST: Remove product from cart
  - Add product to cart
  - Click "Remove" on cart item
  - Product removed
  - Total updates

TEST: Apply discount
  - Add products to cart
  - Enter discount amount
  - Total decreases

TEST: Process payment
  - Add products to cart
  - Select payment method
  - Enter payment amount >= total
  - Click "Pay"
  - Receipt modal shown
  - Cart cleared
  - Stock updated

TEST: Payment amount < total
  - Add products to cart
  - Enter payment amount < total
  - Click "Pay"
  - Error: "Payment must cover total"

TEST: Cash change calculation
  - Add products (total = 55000)
  - Select Cash payment
  - Enter 60000
  - Change shows 5000

TEST: POS with customer
  - Select customer
  - Add products
  - Checkout
  - Invoice linked to customer
```

### 4.6 Billing E2E Tests

**File:** `tests/e2e/billing.spec.ts`

```
TEST: Billing list page
  - Navigate to /billings
  - Table shows billing data
  - Status filter works

TEST: Create billing
  - Click "Create Billing"
  - Select customer
  - Select pet
  - Submit
  - Redirect to billing detail
  - Status shows "OPEN"

TEST: Add items to billing
  - Navigate to OPEN billing
  - Click "Add Item"
  - Select item type (Service/Drug/Product)
  - Select item
  - Enter quantity
  - Submit
  - Item appears in list
  - Running total updates

TEST: Remove item from billing
  - Navigate to OPEN billing
  - Click "Remove" on item
  - Item removed
  - Running total updates

TEST: Complete billing
  - Navigate to OPEN billing with items
  - Click "Complete Billing"
  - Status changes to "COMPLETED"
  - Invoice link appears

TEST: Cannot add items to COMPLETED billing
  - Navigate to COMPLETED billing
  - No "Add Item" button visible
```

### 4.7 Master Data E2E Tests

**File:** `tests/e2e/master-data.spec.ts`

```
TEST: Services page
  - Navigate to /master/services
  - Table shows services
  - Create button visible (Owner only)

TEST: Create service
  - Click "Create Service"
  - Fill: name, category, price
  - Submit
  - Service appears in table

TEST: Update service
  - Click "Edit" on service
  - Modify price
  - Submit
  - Updated price shown

TEST: Archive service
  - Click "Archive" on service
  - Confirm
  - Service status = "Archived"

TEST: Drugs page
  - Navigate to /master/drugs
  - Table shows drugs

TEST: Create drug
  - Click "Create Drug"
  - Fill: name, unit, price
  - Submit
  - Drug appears in table

TEST: Cannot change drug unit after creation
  - Edit drug
  - Unit field disabled/readonly

TEST: Products page
  - Navigate to /master/products
  - Table shows products

TEST: Create product
  - Click "Create Product"
  - Fill: name, category, price, stock
  - Submit
  - Product appears in table

TEST: Stock management page
  - Navigate to /master/stock
  - Table shows products with stock levels
  - Low stock filter works

TEST: Adjust stock
  - Click "Adjust" on product
  - Enter quantity and reason
  - Submit
  - Stock level updated
  - StockAdjustment record created
```

### 4.8 Portal E2E Tests

**File:** `tests/e2e/portal.spec.ts`

```
TEST: Portal dashboard
  - Login as Customer
  - Navigate to /portal/dashboard
  - Pet cards visible
  - Recent visits visible
  - Unpaid invoices visible

TEST: Portal - My Pets
  - Navigate to /portal/pets
  - Pet cards displayed
  - Add pet button visible

TEST: Portal - Add pet
  - Click "Add Pet"
  - Fill form
  - Submit
  - Pet appears in list

TEST: Portal - Visit history
  - Navigate to /portal/visits
  - Visit cards displayed
  - Filter by pet works
  - Filter by date works

TEST: Portal - Visit detail
  - Click on visit
  - Medical record displayed
  - Download buttons visible

TEST: Portal - Invoices
  - Navigate to /portal/invoices
  - Invoice cards displayed
  - Filter by status works

TEST: Portal - Download invoice PDF
  - Click download on invoice
  - PDF downloaded

TEST: Portal - Prescriptions
  - Navigate to /portal/prescriptions
  - Prescription cards displayed

TEST: Portal - Profile
  - Navigate to /portal/profile
  - Edit form displayed
  - Update profile
  - Success toast shown

TEST: Portal - Cannot access other customers' data
  - Login as Customer A
  - Try to access /portal/visits/[customerB_visit_id]
  - Redirect or empty state
```

### 4.9 Dashboard E2E Tests

**File:** `tests/e2e/dashboard.spec.ts`

```
TEST: Owner dashboard loads
  - Login as Owner
  - Navigate to /dashboard
  - Stats cards visible (4)
  - Charts visible
  - Pending actions visible
  - Recent transactions visible

TEST: Dashboard stats accuracy
  - Verify today's visits count
  - Verify today's revenue
  - Verify pending payments count
  - Verify low stock count

TEST: Dashboard responsive
  - Resize to mobile
  - Stats stack vertically
  - Charts full-width
```

### 4.10 Reports E2E Tests

**File:** `tests/e2e/reports.spec.ts`

```
TEST: Reports page loads
  - Navigate to /reports
  - Tabs visible: Daily, Revenue, Inventory, Customers, Payments

TEST: Daily report
  - Select date
  - Data displayed
  - Charts rendered

TEST: Revenue report
  - Select date range
  - Data displayed

TEST: Export CSV
  - Click export button
  - CSV file downloaded
```

### 4.11 Settings E2E Tests

**File:** `tests/e2e/settings.spec.ts`

```
TEST: Settings page loads
  - Navigate to /settings
  - Tabs visible: Company, Tax, Payment Methods, Numbering

TEST: Update company info
  - Edit company name
  - Save
  - Success toast

TEST: Update tax config
  - Change tax type to PERCENTAGE
  - Set value
  - Save

TEST: Manage payment methods
  - Toggle method status
  - Cannot deactivate last active method

TEST: User management
  - Navigate to /settings/users
  - Table shows users
  - Create user
  - Edit user
  - Disable user
```

### 4.12 Notification E2E Tests

**File:** `tests/e2e/notifications.spec.ts`

```
TEST: Notification bell
  - Click bell icon
  - Notification list opens
  - Unread count shown

TEST: Mark notification as read
  - Click notification
  - Marked as read
  - Count decreases

TEST: Mark all as read
  - Click "Mark all as read"
  - All marked as read
  - Count = 0

TEST: Empty notifications
  - No notifications
  - "No notifications" message shown
```

### 4.13 Responsive E2E Tests

**File:** `tests/e2e/responsive.spec.ts`

```
TEST: Mobile layout
  - Resize to 375px
  - Sidebar hidden
  - Hamburger menu works
  - Data tables convert to cards
  - Forms full-width
  - Portal bottom nav visible

TEST: Tablet layout
  - Resize to 768px
  - Sidebar collapsed to icons
  - Data tables compact

TEST: Desktop layout
  - Resize to 1280px
  - Sidebar visible
  - Data tables full
  - Dashboard 4-column stats

TEST: POS responsive
  - Mobile: stacked layout
  - Desktop: side-by-side layout
```

---

## 5. ACCEPTANCE CRITERIA - DETAILED TEST CASES

### 5.1 Authentication (29.1)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-AUTH-001 | User logs in with valid email + password | Redirect to role-appropriate dashboard |
| AC-AUTH-002 | User logs in with invalid password | Error: "Invalid email or password" |
| AC-AUTH-003 | User logs in with non-existent email | Error: "Invalid email or password" |
| AC-AUTH-004 | User fails login 5 times | Account locked for 30 minutes |
| AC-AUTH-005 | User requests password reset | Email sent with reset link |
| AC-AUTH-006 | User resets password with valid token | Password updated, redirected to login |
| AC-AUTH-007 | User resets password with expired token | Error: "Reset link expired" |
| AC-AUTH-008 | User session times out after 12 hours | Redirect to login |
| AC-AUTH-009 | User logs out | Session cleared, redirect to login |
| AC-AUTH-010 | Password meets complexity requirements | 8+ chars, uppercase, lowercase, number |

### 5.2 Customer Management (29.2)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-CUST-001 | Staff creates customer with name, phone, address | Customer created, status ACTIVE |
| AC-CUST-002 | Staff creates customer with duplicate phone | Error: CONFLICT |
| AC-CUST-003 | Staff creates customer with email | Portal account auto-created |
| AC-CUST-004 | Staff creates customer without email | No portal account |
| AC-CUST-005 | Staff edits customer profile | Fields updated |
| AC-CUST-006 | Staff views customer detail | All pets, visits, invoices shown |
| AC-CUST-007 | Staff searches customer | Results filtered by search term |
| AC-CUST-008 | Owner archives customer (no active visits) | Status = ARCHIVED |
| AC-CUST-009 | Owner archives customer (active visits) | Error |
| AC-CUST-010 | Customer self-registration not allowed | No registration page for customers |

### 5.3 Pet Management (29.3)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-PET-001 | Staff adds pet with name, species, breed | Pet created, linked to customer |
| AC-PET-002 | Customer adds pet via portal | Pet created, linked to own customer |
| AC-PET-003 | Staff archives pet | Status = ARCHIVED (soft delete) |
| AC-PET-004 | Archived pet hidden from dropdowns | Not shown in pet selection |
| AC-PET-005 | Archived pet visible in history | Shown in pet list with status |
| AC-PET-006 | Cannot edit archived pet | Error or read-only |
| AC-PET-007 | Pet species is enum | Only valid species selectable |
| AC-PET-008 | Pet weight >= 0 | Validation enforced |

### 5.4 Visit Workflow (29.4)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-VIS-001 | Doctor creates visit with all required fields | Visit created, status DRAFT |
| AC-VIS-002 | Doctor selects multiple services | All services added with prices |
| AC-VIS-003 | Doctor selects multiple drugs | All drugs added with quantities |
| AC-VIS-004 | Prices captured from master data | VisitItem prices match Service/Drug prices |
| AC-VIS-005 | Doctor cannot modify prices | Price fields read-only |
| AC-VIS-006 | Visit saves as DRAFT | Status = DRAFT |
| AC-VIS-007 | Doctor completes visit | Status = COMPLETED, Invoice generated |
| AC-VIS-008 | Invoice auto-generated | Invoice with correct totals |
| AC-VIS-009 | Prescription auto-generated from drugs | Prescription with drug items |
| AC-VIS-010 | DRAFT visits editable | Edit button visible |
| AC-VIS-011 | COMPLETED visits not editable | No edit button |
| AC-VIS-012 | Cannot complete visit without items | Error |
| AC-VIS-013 | Cannot complete visit without diagnosis | Error |
| AC-VIS-014 | Visit number format correct | VIS-YYYY-MMDD-XXXXX |

### 5.5 Billing (29.5)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-BIL-001 | Staff creates billing for customer/pet | Billing created, status OPEN |
| AC-BIL-002 | Staff adds services to billing | Items added with prices |
| AC-BIL-003 | Staff adds drugs to billing | Items added |
| AC-BIL-004 | Staff adds products to billing | Items added with stock check |
| AC-BIL-005 | Items added while OPEN | Items saved |
| AC-BIL-006 | Cannot add items after COMPLETED | Error or button hidden |
| AC-BIL-007 | Staff completes billing | Status = COMPLETED, Invoice generated |
| AC-BIL-008 | Completed billing items immutable | Cannot edit items |

### 5.6 POS (29.6)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-POS-001 | Cashier searches product | Results shown |
| AC-POS-002 | Cashier adds product to cart | Product in cart, total updated |
| AC-POS-003 | Stock checked before adding | Error if insufficient |
| AC-POS-004 | Subtotal calculated correctly | SUM(price * qty) |
| AC-POS-005 | Tax calculated correctly | Based on settings |
| AC-POS-006 | Discount applied correctly | Flat or percentage |
| AC-POS-007 | Payment processed | Invoice + Payment created |
| AC-POS-008 | Change calculated for cash | payment - total |
| AC-POS-009 | Stock decreases on completion | Product.current_stock -= qty |
| AC-POS-010 | Receipt generated | Receipt number format correct |
| AC-POS-011 | Insufficient stock error | Error with available qty |

### 5.7 Payment (29.7)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-PAY-001 | Payment recorded against invoice | Payment record created |
| AC-PAY-002 | Invoice status = PAID on full payment | Status updated |
| AC-PAY-003 | Partial payment recorded | paid_amount incremented |
| AC-PAY-004 | Payment > invoice total | Error: exceeds balance |
| AC-PAY-005 | Payments cannot be deleted | No delete action |
| AC-PAY-006 | Payment number format correct | PAY-YYYY-MMDD-XXXXX |

### 5.8 Master Data (29.8)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-MD-001 | Owner CRUD services | Create, update, archive work |
| AC-MD-002 | Owner CRUD drugs | Create, update, archive work |
| AC-MD-003 | Owner CRUD products | Create, update, archive work |
| AC-MD-004 | Archived items hidden from selection | Not in dropdowns |
| AC-MD-005 | Archived items visible in history | Shown in lists |
| AC-MD-006 | Category cannot archive with products | Error |
| AC-MD-007 | Drug unit immutable after creation | Cannot change |
| AC-MD-008 | Service price change affects new visits only | Historical data unchanged |

### 5.9 Customer Portal (29.9)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-PRT-001 | Customer logs in | Redirect to /portal/dashboard |
| AC-PRT-002 | Customer views dashboard | Stats and recent activity shown |
| AC-PRT-003 | Customer views pets | All own pets shown |
| AC-PRT-004 | Customer views visit history | All own visits shown |
| AC-PRT-005 | Customer filters visits | By pet, date, status |
| AC-PRT-006 | Customer views medical records | Complaint, diagnosis, treatment |
| AC-PRT-007 | Customer views invoices | All own invoices shown |
| AC-PRT-008 | Customer downloads invoice PDF | PDF downloaded |
| AC-PRT-009 | Customer views prescriptions | All own prescriptions shown |
| AC-PRT-010 | Customer downloads prescription PDF | PDF downloaded |
| AC-PRT-011 | Customer edits profile | Fields updated |
| AC-PRT-012 | Customer adds pet | Pet created |
| AC-PRT-013 | Customer cannot access other data | Empty state or redirect |

### 5.10 Reports (29.10)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-RPT-001 | Daily report shows correct totals | Matches database |
| AC-RPT-002 | Revenue report with date filtering | Data filtered correctly |
| AC-RPT-003 | Inventory report shows stock levels | Current stock displayed |
| AC-RPT-004 | Customer report shows activity | Visit frequency, spend |
| AC-RPT-005 | Export as CSV | File downloaded with data |

### 5.11 Notifications (29.11)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-NOT-001 | Email sent on visit completion | Customer receives email |
| AC-NOT-002 | Email sent on invoice generation | Customer receives email |
| AC-NOT-003 | Email sent on payment confirmation | Customer receives email |
| AC-NOT-004 | Low stock alert sent to Owner | Owner receives email |
| AC-NOT-005 | In-app notification in bell | Bell shows unread count |
| AC-NOT-006 | Notifications marked as read | Click marks as read |

### 5.12 Security (29.12)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-SEC-001 | Unauthorized access blocked | Redirect to login |
| AC-SEC-002 | Doctor cannot access /master/* | 403 or redirect |
| AC-SEC-003 | Cashier cannot modify master data | No edit buttons |
| AC-SEC-004 | Customer cannot access other data | Empty state |
| AC-SEC-005 | All inputs validated server-side | Server rejects invalid data |
| AC-SEC-006 | Audit trail for all mutations | AuditLog records created |

### 5.13 Deployment (29.13)

| ID | Test Case | Expected Result |
|---|---|---|
| AC-DEP-001 | Application builds | No errors |
| AC-DEP-002 | Database migrations run | All migrations applied |
| AC-DEP-003 | Seed data inserted | Roles, permissions, defaults |
| AC-DEP-004 | Storage buckets created | Correct policies |
| AC-DEP-005 | Health check returns 200 | /api/health OK |
| AC-DEP-006 | Environment variables documented | .env.example complete |

---

## 6. TEST DATA REQUIREMENTS

### 6.1 Seed Data for Tests

```
ROLES:
- Owner (id: role-owner)
- Doctor (id: role-doctor)
- Cashier (id: role-cashier)
- Admin (id: role-admin)
- Customer (id: role-customer)

USERS:
- owner@haland.com (Owner)
- doctor@haland.com (Doctor)
- cashier@haland.com (Cashier)
- admin@haland.com (Admin)
- customer@haland.com (Customer, linked to customer record)

CUSTOMERS:
- Customer A (active, with pets, with visits)
- Customer B (active, with pets, no visits)
- Customer C (archived)

PETS:
- Dog belonging to Customer A
- Cat belonging to Customer A
- Bird belonging to Customer B

SERVICES:
- Konsultasi (Consultation) - Rp 150,000
- Vaksin RABIES (Vaccination) - Rp 200,000
- Grooming - Rp 100,000

DRUGS:
- Amoxicillin 500mg (tablets) - Rp 5,000/tablet
- Paracetamol 500mg (tablets) - Rp 3,000/tablet

PRODUCTS:
- Royal Canin Dog Food (Food category) - Rp 450,000, stock: 50
- Cat Litter (Accessories category) - Rp 75,000, stock: 100
- Low Stock Product (stock: 2, reorder_point: 10)

PRODUCT CATEGORIES:
- Food
- Medicine
- Accessories

SETTINGS:
- Tax: PERCENTAGE 10%, enabled
- Payment methods: Cash (active), Bank Transfer (active)
- Numbering: default prefixes
```

### 6.2 Mock Data Strategy

```
UNIT TESTS:
- Mock Prisma client (vi.mock)
- Mock Auth.js session
- Mock Resend email
- Mock file storage

INTEGRATION TESTS:
- Use test database (separate from dev)
- Reset database before each test suite
- Seed required data

E2E TESTS:
- Use Playwright fixtures
- Login as different roles
- Navigate and interact with real UI
- Assert on visible elements
```

### 6.3 Edge Case Coverage

```
BOUNDARY VALUES:
- Empty strings for required fields
- Maximum length strings (255 chars)
- Zero values for numbers
- Negative values where not allowed
- Exact boundary values (10 chars for phone)

CONCURRENT OPERATIONS:
- Two cashiers selling same product simultaneously
- Stock deduction race condition
- Two users editing same record

DATA INTEGRITY:
- Orphaned records (cascade behavior)
- Unique constraint violations
- Foreign key violations

PERMISSION BOUNDARIES:
- Each role accessing each route
- Each role performing each action
- Cross-role access attempts
```

---

## 7. PERFORMANCE TESTING CHECKLIST

| Test | Tool | Target |
|---|---|---|
| Initial page load | Lighthouse | < 2 seconds |
| Navigation | Lighthouse | < 1 second |
| Lighthouse score | Lighthouse | >= 80 |
| Time to Interactive | Lighthouse | < 3 seconds |
| Database query time | Prisma logs | < 100ms per query |
| Server Action response | Network tab | < 500ms |
| API route response | Network tab | < 200ms |
| Bundle size | Next.js build | < 250KB first load |
| Core Web Vitals | Vercel Analytics | LCP < 2.5s, FID < 100ms, CLS < 0.1 |

---

## 8. SECURITY TESTING CHECKLIST

| Test | Method | Expected |
|---|---|---|
| SQL injection | Attempt malicious input | Prisma parameterized queries block |
| XSS | Attempt script injection | React auto-escaping blocks |
| CSRF | Attempt cross-site request | Auth.js CSRF protection blocks |
| Unauthorized route access | Direct URL access | Middleware blocks |
| Role escalation | Attempt admin actions as doctor | Server-side check blocks |
| Data leakage | Check API responses | Only authorized data returned |
| Password storage | Check database | Bcrypt hashed, not plaintext |
| Session security | Check cookies | httpOnly, secure, sameSite |
| File upload validation | Upload invalid types | Server rejects |
| Rate limiting | Rapid requests | Rate limiter blocks |

---

## 9. PRD FILE MAPPING TO TESTS

### 9.1 How Each PRD File Maps to Tests

| PRD File | Maps To |
|---|---|
| PRD-Overview.md | Acceptance criteria tests (Section 5), Deployment tests |
| PRD-Functional.md | Unit tests (Section 2), Integration tests (Section 3), E2E tests (Section 4) |
| PRD-Database.md | Database integration tests (Section 3.3), Data integrity tests |
| PRD-Architecture.md | Server Action tests, API route tests, Component tests |
| PRD-Deployment.md | Deployment tests (AC-DEP), Health check tests |
| PRD-Frontend-UIUX.md | Responsive tests (Section 4.13), UI component tests |
| PRD-Workflows.md | Integration tests (Section 3), E2E tests (Section 4), Edge case tests |

### 9.2 Traceability Matrix

| Business Rule | Test Location |
|---|---|
| Visit state machine | AC-VIS-006 to AC-VIS-011, visits.spec.ts |
| Billing state machine | AC-BIL-001 to AC-BIL-008, billing.spec.ts |
| POS atomic transaction | AC-POS-001 to AC-POS-011, pos.spec.ts |
| Payment cannot exceed invoice | AC-PAY-004, payments.test.ts |
| Stock cannot go negative | AC-POS-003, AC-POS-011, pos.test.ts |
| Drug unit immutable | AC-MD-007, drugs.test.ts |
| Service price historical | AC-MD-008, services.test.ts |
| Customer phone unique | AC-CUST-002, customers.test.ts |
| Portal data isolation | AC-PRT-013, portal.spec.ts |
| Audit trail for mutations | AC-SEC-006, all action tests |
| Account lockout | AC-AUTH-004, auth.test.ts |
| Session timeout | AC-AUTH-008, auth.integration.test.ts |

---

## 10. TEST EXECUTION COMMANDS

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests
pnpm test

# Coverage report
pnpm test:coverage

# Specific test file
pnpm vitest run tests/unit/lib/validators.test.ts

# Watch mode
pnpm vitest watch

# E2E with UI
pnpm playwright test --ui

# E2E headed mode (browser visible)
pnpm playwright test --headed
```

---

## 11. TEST REPORTING

### 11.1 Coverage Report

```
Generate HTML coverage report:
pnpm test:coverage --reporter=html

Open in browser:
open coverage/index.html
```

### 11.2 E2E Report

```
Generate HTML report:
pnpm playwright test --reporter=html

Open in browser:
open playwright-report/index.html
```

### 11.3 CI Integration

```yaml
# GitHub Actions workflow
- name: Run tests
  run: |
    pnpm test:unit
    pnpm test:integration
    pnpm test:e2e
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

---

**END OF DOCUMENT**
