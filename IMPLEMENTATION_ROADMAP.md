# Klinik Hewan — Implementation Roadmap & Code Patterns

**Focus**: Actionable code improvements and implementation patterns  
**Timeline**: production-ready with full test coverage

---

## Phase 1: Critical Fixes 

### 1.1 Replace NextAuth Beta

**Status**: 🔴 CRITICAL  
**Risk**: Deployment blocker

**Current Issue**:
```json
{
  "next-auth": "5.0.0-beta.32"  // ❌ Beta version
}
```

**Option A: Upgrade to Stable (Recommended)**
```bash
# Wait for stable release or use:
pnpm add next-auth@5.0.0  # When released
```

**Option B: Downgrade to v4 (Immediate)**
```bash
pnpm remove next-auth
pnpm add next-auth@^4.24.0  # Proven stable

# Migrate code:
# auth.ts: Change only imports
- import NextAuth from 'next-auth'
+ import { NextAuthOptions } from 'next-auth'
- export const { handlers, signIn, signOut, auth } = NextAuth({...})
+ export const authOptions = {...}
+ export const handlers = NextAuth(authOptions)
```

**Validation**:
```bash
pnpm build  # Should complete without warnings
npm audit   # No security issues
```

---

### 1.2 Add Error Boundaries

**Impact**: Prevents white-screen crashes  

**Add Error Boundary:**
```typescript
// src/components/shared/error-boundary.tsx (UPDATE)
'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service
    console.error('Error boundary caught:', error);
    // TODO: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Something went wrong</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
        
        <p className="text-xs text-gray-500 mt-3">
          Error ID: {error.digest || 'unknown'}
        </p>
      </div>
    </div>
  );
}
```

**Use in Routes:**
```typescript
// app/(dashboard)/error.tsx (CREATE)
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default ErrorBoundary;

// app/(auth)/error.tsx (CREATE)
export default ErrorBoundary;

// app/(portal)/error.tsx (CREATE)
export default ErrorBoundary;
```

---

### 1.3 Add Rate Limiting

**Impact**: Prevents DOS attacks, brute force  

**Install & Configure:**
```bash
pnpm add next-rate-limit
```

**Create Middleware:**
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Auth endpoint: 10 requests per 15 minutes per IP
export const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// API endpoint: 100 requests per minute per user
export const apiLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});
```

**Apply to Auth Route:**
```typescript
// src/app/api/auth/[...nextauth]/route.ts (UPDATE)
import { authLimiter } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export const POST = async (req: NextRequest) => {
  const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
  
  const { success } = await authLimiter.limit(ip);
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  // ... existing handler
};
```

**For Upstash Redis (recommended):**
```bash
# Add to .env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

### 1.4 Add Security Headers

**Impact**: Protects against XSS, clickjacking  

**Update next.config.ts:**
```typescript
// next.config.ts (UPDATE)
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Phase 2: Testing Foundation

### 2.1 Unit Tests Setup

**Install Dependencies:**
```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 happy-dom
```

**Create vitest.config.ts:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Create setup file:**
```typescript
// src/__tests__/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### 2.2 Validators Test Suite

**Unit Tests for Validators:**
```typescript
// src/__tests__/unit/validators.test.ts
import { describe, it, expect } from 'vitest';
import {
  customerSchema,
  petSchema,
  serviceSchema,
  visitFormSchema,
} from '@/lib/validators';

describe('Customer Validator', () => {
  it('should accept valid customer data', () => {
    const data = {
      name: 'John Doe',
      phone: '08123456789',
      address: 'Jl. Main St',
    };
    const result = customerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone number', () => {
    const data = {
      name: 'John',
      phone: '123', // Too short
      address: 'Jl. Main St',
    };
    const result = customerSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('phone');
    }
  });

  it('should accept optional email', () => {
    const data = {
      name: 'John',
      phone: '08123456789',
      address: 'Jl. Main St',
      email: '', // Empty is valid
    };
    const result = customerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const data = {
      name: 'John',
      phone: '08123456789',
      address: 'Jl. Main St',
      email: 'not-an-email',
    };
    const result = customerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Pet Validator', () => {
  it('should accept valid pet data', () => {
    const data = {
      name: 'Fluffy',
      species: 'Kucing',
      breed: 'Persia',
      weightKg: 3.5,
    };
    const result = petSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid species', () => {
    const data = {
      name: 'Fluffy',
      species: 'Dinosaur', // Invalid
    };
    const result = petSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject negative weight', () => {
    const data = {
      name: 'Fluffy',
      species: 'Kucing',
      weightKg: -5, // Invalid
    };
    const result = petSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Service Validator', () => {
  it('should accept valid service', () => {
    const data = {
      name: 'Vaksinasi Rabies',
      category: 'VAKSINASI',
      price: 250000,
    };
    const result = serviceSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject zero price', () => {
    const data = {
      name: 'Vaksinasi',
      category: 'VAKSINASI',
      price: 0, // Invalid
    };
    const result = serviceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Visit Form Validator', () => {
  it('should accept valid visit form', () => {
    const data = {
      customerId: 'cust_123',
      petId: 'pet_456',
      visitDate: '2024-07-24',
      chiefComplaint: 'Diare',
      diagnosis: 'Gastroenteritis',
    };
    const result = visitFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should require chief complaint', () => {
    const data = {
      customerId: 'cust_123',
      petId: 'pet_456',
      visitDate: '2024-07-24',
      chiefComplaint: '', // Required
      diagnosis: 'Gastroenteritis',
    };
    const result = visitFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

**Run Tests:**
```bash
pnpm test                    # Watch mode
pnpm test:run               # Single run
pnpm test:coverage          # Coverage report
```

---

### 2.3 Server Action Tests

**Integration Tests for Server Actions:**
```typescript
// src/__tests__/integration/customers.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCustomer, updateCustomer, deleteCustomer } from '@/server/actions/customers';
import prisma from '@/server/lib/prisma';

// Mock auth
vi.mock('@/server/lib/auth', () => ({
  auth: vi.fn(() => ({
    user: {
      id: 'user_123',
      email: 'test@example.com',
      role: 'OWNER',
    },
  })),
}));

describe('Customer Actions', () => {
  beforeEach(async () => {
    // Setup: Clear test data
    await prisma.customer.deleteMany({});
  });

  afterEach(async () => {
    // Cleanup
    await prisma.customer.deleteMany({});
  });

  it('should create customer with portal account', async () => {
    const formData = new FormData();
    formData.append('name', 'Dr. John');
    formData.append('phone', '08123456789');
    formData.append('address', 'Jl. Main');
    formData.append('email', 'dr@example.com');

    const result = await createCustomer(null, formData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    // Verify customer created
    const customer = await prisma.customer.findUnique({
      where: { phone: '08123456789' },
    });
    expect(customer).toBeDefined();
    expect(customer?.name).toBe('Dr. John');

    // Verify portal user created
    const user = await prisma.user.findFirst({
      where: { email: 'dr@example.com' },
    });
    expect(user).toBeDefined();
  });

  it('should reject duplicate phone number', async () => {
    // Create first customer
    const formData1 = new FormData();
    formData1.append('name', 'John 1');
    formData1.append('phone', '08123456789');
    formData1.append('address', 'Jl. Main');

    await createCustomer(null, formData1);

    // Attempt to create with same phone
    const formData2 = new FormData();
    formData2.append('name', 'John 2');
    formData2.append('phone', '08123456789');
    formData2.append('address', 'Jl. Main');

    const result = await createCustomer(null, formData2);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('already registered');
  });

  it('should deny unauthorized access', async () => {
    // Mock auth to return no session
    vi.mocked(auth).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('name', 'John');
    formData.append('phone', '08123456789');

    const result = await createCustomer(null, formData);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });
});
```

---

### 2.4 E2E Tests

**End-to-End Tests with Playwright:**
```typescript
// e2e/workflows/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@klinikhewan.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  it('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@klinikhewan.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email atau password salah')).toBeVisible();
  });

  it('should lockout after 5 failed attempts', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'admin@klinikhewan.com');
      await page.fill('input[name="password"]', 'wrong');
      await page.click('button[type="submit"]');
    }

    await expect(page.locator('text=Akun terkunci')).toBeVisible();
  });
});

// e2e/workflows/customer.spec.ts
test.describe('Customer Management', () => {
  test('should create customer and portal account', async ({ page }) => {
    await loginAsOwner(page);

    await page.goto('/dashboard/customers');
    await page.click('button:has-text("Tambah Pelanggan")');

    await page.fill('input[name="name"]', 'Budi Santoso');
    await page.fill('input[name="phone"]', '08123456789');
    await page.fill('input[name="email"]', 'budi@example.com');
    await page.fill('input[name="address"]', 'Jl. Merdeka');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Pelanggan berhasil dibuat')).toBeVisible();
    await expect(page.locator('text=Budi Santoso')).toBeVisible();
  });
});

// Helper function
async function loginAsOwner(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@klinikhewan.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}
```

---

## Phase 3: Observability

### 3.1 Structured Logging

**Install Logging:**
```bash
pnpm add pino pino-pretty
pnpm add -D @types/pino
```

**Create Logger Utility:**
```typescript
// src/server/lib/logger.ts
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: false,
        ignore: 'pid,hostname',
      },
    },
  }),
});

export function createLogger(context: string) {
  return logger.child({ context });
}
```

**Use in Server Actions:**
```typescript
// src/server/actions/customers.ts (UPDATE)
import { createLogger } from '@/server/lib/logger';

const log = createLogger('actions:customers');

export async function createCustomer(_prevState: any, formData: FormData) {
  try {
    log.info({ phone: formData.get('phone') }, 'Creating customer');

    const session = await auth();
    if (!session?.user) {
      log.warn('Unauthorized attempt to create customer');
      return { success: false, error: { message: "Unauthorized" } };
    }

    // ... validation & creation

    log.info({ customerId: customer.id }, 'Customer created successfully');

    return { success: true, data: customer.id };
  } catch (error) {
    log.error({ error }, 'Failed to create customer');
    throw error;
  }
}
```

---

### 3.2 Error Tracking with Sentry

**Install Sentry:**
```bash
pnpm add @sentry/nextjs
```

**Initialize Sentry:**
```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
});
```

**Add Environment Variable:**
```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://...@...ingest.sentry.io/...
```

---

## Phase 4: Database Optimization

### 4.1 Fix N+1 Queries

**Before (N+1 Query Problem):**
```typescript
// ❌ Bad: loads all customers, then for each loads all pets (1 + N queries)
const customers = await prisma.customer.findMany();
for (const customer of customers) {
  const pets = await prisma.pet.findMany({
    where: { customerId: customer.id }
  });
}
```

**After (Batch Loading):**
```typescript
// ✅ Good: single query with include
const customersWithPets = await prisma.customer.findMany({
  include: {
    pets: {
      where: { status: 'ACTIVE' },
      take: 10, // Limit related items
    },
  },
  take: 100, // Limit main query
});
```

**Identify N+1 Problems:**
```typescript
// Add to middleware during development
if (process.env.NODE_ENV === 'development') {
  const originalFindUnique = prisma.customer.findUnique.bind(prisma.customer);
  let queryCount = 0;

  (prisma.customer.findUnique as any) = async (...args) => {
    queryCount++;
    if (queryCount > 5) {
      console.warn('⚠️ Potential N+1 query detected!', new Error().stack);
    }
    return originalFindUnique(...args);
  };
}
```

### 4.2 Add Missing Indexes

**Review Schema & Add Indexes:**
```prisma
// prisma/schema.prisma (UPDATE)

model AuditLog {
  @@index([createdAt])              // ← NEW: for timeline queries
  @@index([userId, createdAt])      // ← NEW: for user activity
  @@index([entityType, entityId, createdAt]) // ← NEW: for entity history
}

model Invoice {
  @@index([customerId, status])     // ← NEW: for "customer's unpaid invoices"
  @@index([invoiceDate, status])    // ← NEW: for reports
}

model Visit {
  @@index([customerId, visitDate])  // ← NEW: for visit history
}
```

**Apply Migrations:**
```bash
pnpm db:migrate dev --name "add-missing-indexes"
```

### 4.3 Implement Cursor-Based Pagination

**Pagination Utility:**
```typescript
// src/server/lib/pagination.ts
import { Prisma } from '@prisma/client';

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
}

export async function paginate<T>(
  query: Promise<T[]>,
  cursor?: string,
  limit: number = 20
): Promise<PaginatedResult<T>> {
  // Fetch limit + 1 to check if there are more
  const items = await query;
  const hasMore = items.length > limit;
  const data = items.slice(0, limit);

  return {
    data,
    cursor: data[data.length - 1]?.id,
    hasMore,
  };
}
```

**Use in Queries:**
```typescript
export async function getInvoices(
  customerId: string,
  { cursor, limit = 20 }: PaginationParams = {}
): Promise<PaginatedResult<Invoice>> {
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    orderBy: { invoiceDate: 'desc' },
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    take: limit + 1,
  });

  return paginate(invoices, cursor, limit);
}
```

---

## Phase 5: Deployment

### 5.1 GitHub Actions CI/CD

**Create workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:run
      
  deploy:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v28
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

### 5.2 Environment Configuration

**.env.production:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@prod.db.com/klinik

# Auth
NEXTAUTH_URL=https://klinik-hewan.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@klinik-hewan.com

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=...
LOG_LEVEL=info

# Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Success Metrics

### By End of Phase 1
- ✅ NextAuth updated/fixed
- ✅ Error boundaries on all routes
- ✅ Rate limiting active
- ✅ Security headers configured
- ✅ Zero deployment-blocking issues

### By End of Phase 2
- ✅ 50+ unit tests passing
- ✅ 10+ integration tests passing
- ✅ 5+ E2E workflows tested
- ✅ CI/CD pipeline working
- ✅ Test coverage > 70%

### By End of Phase 3
- ✅ All errors logged to Sentry
- ✅ Structured logging throughout
- ✅ Dashboard monitoring setup
- ✅ Alert system configured

### By End of Phase 4
- ✅ All N+1 queries resolved
- ✅ Missing indexes added
- ✅ Cursor pagination implemented
- ✅ Database optimized

### End Result
- ✅ Production-ready system
- ✅ Comprehensive test coverage
- ✅ Full observability
- ✅ Excellent performance
- ✅ Security hardened

---

## Checklist for Production Launch

### Security
- [ ] NextAuth v5 stable (or v4.x)
- [ ] Error boundaries deployed
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] HTTPS forced
- [ ] CORS properly configured
- [ ] Database credentials rotated
- [ ] Secrets not in code
- [ ] SQL injection protection verified
- [ ] XSS protection verified

### Testing
- [ ] Unit tests passing (>70% coverage)
- [ ] Integration tests passing
- [ ] E2E tests for critical paths
- [ ] Load tests completed
- [ ] Backup/restore tested

### Monitoring & Ops
- [ ] Error tracking (Sentry) configured
- [ ] Logging system active
- [ ] Database backups automated
- [ ] Alerting rules configured
- [ ] Runbook prepared

### Performance
- [ ] Bundle size < 500KB (JS)
- [ ] Lighthouse score > 90
- [ ] Database query times < 100ms (95th percentile)
- [ ] API response times < 200ms
- [ ] CDN configured

### Compliance
- [ ] Privacy policy deployed
- [ ] GDPR compliance verified
- [ ] Data export feature working
- [ ] User deletion workflow tested
- [ ] Audit trail working

### Documentation
- [ ] README.md up to date
- [ ] Deployment guide prepared
- [ ] Runbook for common issues
- [ ] API documentation (Swagger)
- [ ] Environment variables documented

---
