# HALAND PETCARE - ARCHITECTURE & CODING STANDARDS

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

**END OF DOCUMENT**
