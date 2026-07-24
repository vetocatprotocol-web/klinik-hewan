# HALAND PETCARE - DATABASE ARCHITECTURE

---

## 10. DATABASE ARCHITECTURE

### 10.1 Database Selection

PostgreSQL 14+ via Supabase. Single database instance. No sharding. Vertical scaling only.

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

## 10.2 Prisma Schema Design

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

## 24.3 Migration & Seed Process

### Database Bootstrap

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

### Supabase Bootstrap

Bootstrap process ensures:
- Storage buckets exist with correct policies
- RLS policies are active on all tables
- Database extensions enabled (uuid-ossp, pg_trgm)
- Default data seeded
- Indexes created via Prisma migrations

All operations are idempotent and safe to re-run.

---

**END OF DOCUMENT**
