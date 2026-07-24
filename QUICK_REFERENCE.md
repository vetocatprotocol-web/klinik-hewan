# Klinik Hewan — Quick Reference & Architecture Guide

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                    │
│                  React 19 + Server Components                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Middleware (Authentication/Authorization)       │
│  - Cookie validation (NextAuth session)                      │
│  - Route protection (redirect to /login)                     │
│  - Request filtering                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│          API Routes & Server Actions (Next.js)              │
├─────────────────────────────────────────────────────────────┤
│  /api/auth/*              → NextAuth 5 handlers             │
│  /api/upload              → File upload (auth required)     │
│  /api/notifications/*     → Notification management         │
│  Server Actions           → Form processing (server-side)   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Business Logic Layer (Server-Side)              │
├─────────────────────────────────────────────────────────────┤
│  Validation    → Zod schemas (input validation)             │
│  Auth Checks   → Session + role verification               │
│  Audit Logging → Track all CRUD operations                 │
│  Domain Logic  → Business rule enforcement                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Database Access Layer (Prisma ORM)              │
├─────────────────────────────────────────────────────────────┤
│  Query Builder → Type-safe database queries                │
│  Schema        → PostgreSQL via @prisma/adapter-pg         │
│  Migrations    → Version control for schema                │
│  Seeding       → Initial data population                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              External Services (Third-Party)                 │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL    → Data persistence (Supabase)               │
│  Supabase      → Storage for file uploads                  │
│  Resend        → Email delivery                             │
│  NextAuth      → Authentication & authorization            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Customer Creation Example

```
1. USER INTERACTION (Client)
   ┌──────────────────────────────┐
   │ Form Submit                  │
   │ name: "John"                 │
   │ phone: "08123456789"         │
   │ email: "john@example.com"    │
   └──────────────────────────────┘
                ↓
2. SERVER ACTION (Next.js Server)
   ┌──────────────────────────────┐
   │ createCustomer()             │
   │ - Extract formData           │
   │ - Validate with Zod          │
   │ - Check auth/permissions     │
   └──────────────────────────────┘
                ↓
3. VALIDATION LAYER
   ┌──────────────────────────────┐
   │ customerSchema.safeParse()   │
   │ - name: string (1-255)       │
   │ - phone: digits (10-20)      │
   │ - email: valid format        │
   └──────────────────────────────┘
                ↓
4. BUSINESS LOGIC
   ┌──────────────────────────────┐
   │ Duplicate check              │
   │ - findFirst(name+phone)      │
   │ - Throw if exists            │
   └──────────────────────────────┘
                ↓
5. DATABASE MUTATION (Prisma)
   ┌──────────────────────────────┐
   │ prisma.customer.create()     │
   │ INSERT INTO customers...     │
   └──────────────────────────────┘
                ↓
6. AUTO ACCOUNT CREATION (Optional)
   ┌──────────────────────────────┐
   │ If email provided:           │
   │ - Generate temp password     │
   │ - Hash with bcrypt           │
   │ - Create user account        │
   │ - Send welcome email         │
   └──────────────────────────────┘
                ↓
7. AUDIT LOGGING
   ┌──────────────────────────────┐
   │ createAuditLog()             │
   │ - userId, action, entity     │
   │ - timestamp, IP address      │
   │ - old/new values (JSON)      │
   └──────────────────────────────┘
                ↓
8. RESPONSE (Back to Client)
   ┌──────────────────────────────┐
   │ { success: true,             │
   │   data: "cust_123" }         │
   └──────────────────────────────┘
```

---

## File Structure Reference

```
klinik-hewan/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          ← Login page
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/        ← Staff portal
│   │   │   ├── layout.tsx      ← Sidebar nav
│   │   │   ├── customers/      ← CRUD pages
│   │   │   ├── visits/
│   │   │   ├── billings/
│   │   │   ├── invoices/
│   │   │   ├── pos/            ← Point of sale
│   │   │   ├── master/         ← Services, drugs, products
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── audit-logs/
│   │   ├── (portal)/           ← Customer portal
│   │   │   └── portal/
│   │   │       ├── dashboard/
│   │   │       ├── pets/
│   │   │       ├── visits/
│   │   │       ├── invoices/
│   │   │       ├── prescriptions/
│   │   │       └── profile/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ ← NextAuth handler
│   │   │   ├── upload/             ← File upload
│   │   │   ├── notifications/      ← Notification APIs
│   │   │   └── health/             ← Health check
│   │   └── layout.tsx         ← Root layout
│   ├── components/
│   │   ├── layout/            ← Sidebar, navbar, providers
│   │   ├── shared/            ← Reusable components
│   │   ├── charts/            ← Recharts components
│   │   ├── cards/             ← Stat cards
│   │   ├── data-table/        ← Table UI
│   │   └── ui/                ← shadcn/ui components
│   ├── server/
│   │   ├── actions/           ← Server-side mutations
│   │   │   ├── customers.ts   ← 312 lines
│   │   │   ├── visits.ts
│   │   │   ├── billings.ts    ← 366 lines (largest)
│   │   │   ├── invoices.ts
│   │   │   ├── pos.ts
│   │   │   ├── services.ts
│   │   │   ├── stock.ts
│   │   │   ├── users.ts       ← 209 lines
│   │   │   └── auth.ts
│   │   ├── queries/           ← Data fetching
│   │   │   ├── customers.ts
│   │   │   ├── visits.ts
│   │   │   └── index.ts       ← Centralized queries
│   │   └── lib/
│   │       ├── auth.ts        ← NextAuth config
│   │       ├── prisma.ts      ← Prisma client
│   │       ├── email.ts       ← Email templates
│   │       ├── audit.ts       ← Audit logging
│   │       ├── notifications.ts ← Notifications
│   │       ├── storage.ts     ← Supabase Storage
│   │       └── logger.ts      ← Logging (TODO)
│   ├── lib/
│   │   ├── utils.ts           ← Utility functions
│   │   ├── constants.ts       ← Navigation, enums
│   │   ├── validators.ts      ← Zod schemas
│   │   └── errors.ts          ← Custom errors
│   ├── types/
│   │   └── index.ts           ← TypeScript types
│   └── middleware.ts          ← Route protection
├── prisma/
│   ├── schema.prisma          ← Database schema
│   └── seed.ts                ← Data seeding
├── public/                    ← Static assets
├── package.json
├── tsconfig.json              ← TypeScript config
├── next.config.ts             ← Next.js config
├── tailwind.config.ts         ← Tailwind config
└── eslint.config.mjs          ← ESLint config
```

---

## Database Schema (Simplified ER Diagram)

```
┌────────────┐
│   User     │ (Authentication)
├────────────┤
│ id (PK)    │
│ email*     │ ← Unique
│ password   │ ← Hashed with bcrypt
│ roleId(FK) │ ──┐
│ status     │   │
│ locked_*   │   │ (Account lockout tracking)
│ last_login │   │
└────────────┘   │
                 │
        ┌────────┴─────────┐
        ↓                  ↓
    ┌────────┐        ┌────────┐
    │ Role   │        │ Customer│
    ├────────┤        ├────────┤
    │ id (PK)│        │ id (PK)│
    │ name*  │        │ name   │
    │        │        │ phone* │
    └────────┘        │ userId*│──┐ (Optional: portal user)
                      │ status │  │
                      └────────┘  │
                         │        │
                    ┌────┴────┐   │
                    ↓         ↓   ↓
              ┌────────┐  ┌────────┐
              │ Pet    │  │ User   │(Portal account)
              ├────────┤  │        │
              │ id (PK)│  │        │
              │ name   │  └────────┘
              │ species│
              └────────┘

┌────────────┐
│ Service    │ (Medical services)
├────────────┤
│ id (PK)    │
│ name*      │
│ category   │
│ price      │
└────────────┘

┌────────────┐
│ Drug       │ (Medications)
├────────────┤
│ id (PK)    │
│ name*      │
│ unit       │
│ price      │
└────────────┘

┌────────────┐
│ Product    │ (Retail items)
├────────────┤
│ id (PK)    │
│ name*      │
│ price      │
│ stock      │
│ reorder    │
└────────────┘

┌────────────┐
│ Visit      │ (Medical visits)
├────────────┤
│ id (PK)    │
│ customerId │
│ petId      │
│ visitDate  │
│ status     │ DRAFT → COMPLETED → PAID
│ createdBy  │
└────────────┘
     │
     ├──→ VisitItem (Services/Drugs added)
     └──→ Prescription (Auto-generated from visit)
     └──→ Invoice (Auto-generated when completed)

┌────────────┐
│ Billing    │ (Manual billing)
├────────────┤
│ id (PK)    │
│ customerId │
│ status     │
└────────────┘
     └──→ BillingItem (Services/Drugs)
     └──→ Invoice (Auto-generated)

┌────────────┐
│ Invoice    │ (Financial document)
├────────────┤
│ id (PK)    │
│ number*    │
│ customerId │
│ total      │
│ paid       │
│ status     │ UNPAID → PARTIAL → PAID
└────────────┘

┌────────────┐
│ Payment    │ (Transaction record)
├────────────┤
│ id (PK)    │
│ number*    │
│ amount     │
│ method     │
│ receivedBy │
└────────────┘

┌────────────┐
│ AuditLog   │ (Compliance)
├────────────┤
│ id (PK)    │
│ userId     │
│ action     │
│ entity     │
│ changes    │
│ timestamp  │
└────────────┘

* = Unique constraint
FK = Foreign key
```

---

## Key Features & Implementation Status

### Authentication & Authorization ✅

**Implemented:**
- NextAuth 5 + Credentials provider
- bcrypt password hashing
- JWT tokens
- Account lockout (5 attempts → 30 min lockout)
- Role-based access control (RBAC)
  - OWNER: Full access
  - DOKTER: Visits, prescriptions
  - KASIR: POS, billing
  - CUSTOMER: Portal only

**Code Location:**
- `src/server/lib/auth.ts` (114 lines)
- `src/middleware.ts` (26 lines)

### Customer Management ✅

**Implemented:**
- Full CRUD operations
- Auto-create portal account + email welcome
- Phone uniqueness enforced
- Customer status tracking (ACTIVE/INACTIVE)
- Portal data isolation

**Code Location:**
- `src/server/actions/customers.ts` (312 lines)
- `src/app/(dashboard)/customers/` (UI pages)
- `src/app/(portal)/portal/profile/` (Customer portal)

### Visit Workflow ✅

**State Machine:**
```
DRAFT (Initial)
  ↓ (Doctor enters diagnosis/treatment)
COMPLETED (Visit finished)
  ↓ (Triggers auto-invoice + prescription)
PAID (Invoice fully paid)
  ↓ (End state)
```

**Auto-generated:**
- Invoice from visit items
- Prescription from drugs added
- Email notifications

**Code Location:**
- `src/server/actions/visits.ts`
- `src/app/(dashboard)/visits/`

### Billing & Invoicing ✅

**Features:**
- Flexible item-based billing
- Manual billing adjustment
- Auto-invoice generation from visits/billings
- Partial/full payment tracking
- Payment status transitions

**Code Location:**
- `src/server/actions/billings.ts` (366 lines)
- `src/server/actions/invoices.ts`
- `src/app/(dashboard)/billings/`
- `src/app/(dashboard)/invoices/`

### POS (Point of Sale) ✅

**Features:**
- Product search + add to cart
- Tax calculation
- Discount support
- Payment methods
- Receipt generation
- Stock deduction

**Code Location:**
- `src/server/actions/pos.ts` (297 lines)
- `src/app/(dashboard)/pos/`

### Stock Management ✅

**Features:**
- Current stock tracking
- Reorder point alerts
- Stock adjustment reasons
- Audit trail for movements
- Low stock notifications

**Code Location:**
- `src/server/actions/stock.ts`
- `src/app/(dashboard)/master/stock/`

### Reports ✅

**Available Reports:**
1. Daily report (visits, revenue)
2. Revenue report (by date range)
3. Inventory report (stock levels)
4. Customer report (demographics)
5. Payment report (outstanding invoices)

**Features:**
- Date range filtering
- CSV export
- Charts visualization

**Code Location:**
- `src/app/(dashboard)/reports/`
- `src/components/charts/` (Recharts)

### Audit Trail ✅

**Tracked Events:**
- CREATE, UPDATE, DELETE operations
- Status changes
- Payments
- Archives

**Logged Data:**
- User ID
- Action type
- Entity type + ID
- Old/new values (JSON)
- Timestamp
- IP address + user agent

**Code Location:**
- `src/server/lib/audit.ts`
- `src/app/(dashboard)/audit-logs/`

---

## Common Code Patterns

### Server Action Pattern

```typescript
"use server";

import { auth } from "@/server/lib/auth";
import prisma from "@/server/lib/prisma";
import { actionSchema } from "@/lib/validators";
import { ActionResult } from "@/types";
import { createAuditLog } from "@/server/lib/audit";

export async function myAction(
  _prevState: any,
  formData: FormData
): Promise<ActionResult<MyResultType>> {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  // 2. Authorize (check role/permissions)
  const role = (session.user as any).role;
  if (!["OWNER", "DOKTER"].includes(role)) {
    return { success: false, error: { message: "Forbidden", code: "FORBIDDEN" } };
  }

  // 3. Extract & validate
  const data = {
    field1: formData.get("field1") as string,
    field2: Number(formData.get("field2")),
  };
  const validated = actionSchema.safeParse(data);
  if (!validated.success) {
    const issue = validated.error.issues[0];
    return {
      success: false,
      error: { message: issue.message, field: issue.path[0] as string },
    };
  }

  // 4. Execute business logic
  try {
    const result = await prisma.myEntity.create({
      data: validated.data,
    });

    // 5. Audit log
    await createAuditLog(
      (session.user as any).id,
      "CREATE",
      "MyEntity",
      result.id,
      { created: result }
    );

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, error: { message: "Duplicate entry" } };
      }
    }
    throw error;
  }
}
```

### Component Pattern (Server Component)

```typescript
import { ReactNode } from 'react';
import { auth } from '@/server/lib/auth';
import { redirect } from 'next/navigation';
import { fetchCustomers } from '@/server/queries';

export default async function Page(): Promise<ReactNode> {
  // Server-side: Fetch data directly
  const session = await auth();
  if (!session) redirect('/login');

  const customers = await fetchCustomers();

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

### Client Component Pattern (Interactivity)

```typescript
'use client';

import { useTransition } from 'react';
import { createCustomer } from '@/server/actions/customers';

export function CreateCustomerForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createCustomer(null, formData);
      if (!result.success) {
        setError(result.error.message);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <input type="text" name="name" required />
      <input type="tel" name="phone" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Customer'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
```

---

## Critical Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/klinik_hewan

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Supabase (Storage + Auth provider option)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@example.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Error tracking (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional: Rate limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## Testing Command Reference

```bash
# TypeScript type checking
pnpm typecheck

# ESLint code quality
pnpm lint
pnpm lint --fix

# Run tests (interactive)
pnpm test

# Run tests (CI mode)
pnpm test:run

# Test coverage report
pnpm test:run -- --coverage

# E2E tests
pnpm test:e2e
pnpm test:e2e --ui  # Interactive mode

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Create new migration
pnpm db:migrate:deploy # Apply migrations
pnpm db:seed          # Run seed script
pnpm db:studio        # Open Prisma Studio
pnpm db:reset         # Reset database (dev only!)
```

---

## Deployment Checklist

```bash
# Pre-deployment
[ ] pnpm typecheck      # No type errors
[ ] pnpm lint           # No lint errors
[ ] pnpm test:run       # All tests pass
[ ] pnpm build          # Build succeeds
[ ] npm audit           # No vulnerabilities

# Environment setup
[ ] DATABASE_URL set correctly
[ ] NEXTAUTH_SECRET changed from default
[ ] Email credentials (Resend) configured
[ ] Supabase credentials configured
[ ] HTTPS enforced

# Database
[ ] Migrations applied (pnpm db:migrate:deploy)
[ ] Seed data loaded if needed
[ ] Backups configured

# Monitoring
[ ] Error tracking (Sentry) configured
[ ] Logging level set to 'info'
[ ] Health endpoint working (/api/health)

# Post-deployment
[ ] Test login flow
[ ] Test customer creation
[ ] Test invoice generation
[ ] Verify email sending
[ ] Check error tracking
[ ] Monitor performance
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Akun terkunci" on login | 5 failed attempts | Wait 30 minutes or reset `lockedUntil` in DB |
| Email not sending | Resend API key invalid | Verify `RESEND_API_KEY` and `RESEND_FROM_EMAIL` |
| File upload fails | File size > 5MB | Increase size limit in `api/upload/route.ts` |
| Database connection error | Wrong connection string | Verify `DATABASE_URL` format (postgresql://) |
| Prisma client errors | Schema out of sync | Run `pnpm db:generate` after schema changes |
| Auth redirects to login | Session expired | NextAuth session TTL default 30 days |
| Type errors on build | TypeScript strict mode | Add types to all function parameters |

---

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|---|
| Largest JS bundle | < 500KB | ⚠️ Not measured |
| Lighthouse score | > 90 | ⚠️ Not tested |
| API response time | < 200ms | ⚠️ Untested |
| DB query time (p95) | < 100ms | ⚠️ No monitoring |
| Time to interactive | < 3s | ⚠️ Not measured |
| Core Web Vitals | All green | ⚠️ Not configured |

---

## Resources & Documentation

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth**: https://next-auth.js.org
- **Zod**: https://zod.dev
- **Tailwind**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Supabase**: https://supabase.com/docs

---

**Last Updated**: July 24, 2026

