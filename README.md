# Haland PetCare — Klinik Hewan Management System

Platform manajemen klinik hewan production-ready. Mengelola pelanggan, hewan peliharaan, kunjungan medis, billing, POS, inventaris, dan laporan dalam satu sistem terpadu.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 (driver adapter: `@prisma/adapter-pg`) |
| Auth | NextAuth 5 (Credentials provider, JWT) |
| UI | shadcn/ui + Tailwind CSS 4 |
| Validation | Zod 4 |
| Charts | Recharts |
| Email | Resend |
| Storage | Supabase Storage |

## Fitur Utama

### 4 Role-Based Portals

| Role | Akses |
|------|-------|
| **Owner** | Full access — dashboard, master data, laporan, pengguna, pengaturan, audit log |
| **Dokter** | Kunjungan medis, resep, riwayat pasien |
| **Kasir** | POS, pembayaran, billing |
| **Customer** | Portal — hewan, riwayat kunjungan, resep, invoice, profil |

### Modul Inti

- **Customer Management** — CRUD pelanggan, auto-create akun portal + email welcome
- **Pet Management** — CRUD hewan peliharaan (data isolasi per customer)
- **Visit Workflow** — DRAFT → COMPLETED → PAID, invoice + resep otomatis
- **Billing** — Tambah layanan/obat/produk, selesai → invoice otomatis
- **POS** — Cari produk, keranjang, pembayaran, struk
- **Payment** — Bayar sebagian/lunas, status invoice update otomatis (UNPAID → PARTIAL → PAID)
- **Master Data** — Layanan, Obat, Produk, Kategori (soft delete/archive)
- **Stock Management** — Penyesuaian stok, alert stok menipis otomatis
- **Reports** — Harian, pendapatan, inventaris, pelanggan, pembayaran + export CSV
- **Notifications** — Email (Resend) + in-app (bell component)
- **Audit Trail** — Log semua operasi CRUD dengan old/new values
- **Dark Mode** — Toggle light/dark theme

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL (local atau Supabase)

### 1. Clone & Install

```bash
git clone <repo-url>
cd klinik-hewan
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Isi variabel environment di `.env`:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) | Yes |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL (for emails) | Yes |
| `RESEND_API_KEY` | Resend API key for email | Yes |
| `RESEND_FROM_EMAIL` | Sender email address | Yes |

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate:deploy

# Seed default data (roles, admin user, sample data)
pnpm db:seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Default Login

| Role | Email | Password |
|------|-------|----------|
| Owner | `admin@klinikhewan.com` | `admin123` |

> Ganti password setelah login pertama kali.

## Available Scripts

```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type check
pnpm test             # Unit tests (Vitest)
pnpm test:run         # Run tests once
pnpm test:e2e         # E2E tests (Playwright)

pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Create migration
pnpm db:migrate:deploy # Apply migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Prisma Studio (DB browser)
pnpm db:reset         # Reset database
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, forgot-password, reset-password
│   ├── (dashboard)/         # Staff pages (sidebar layout)
│   │   ├── customers/       # Customer CRUD + detail
│   │   ├── visits/          # Visit CRUD + detail
│   │   ├── billings/        # Billing CRUD + detail
│   │   ├── pos/             # Point of Sale
│   │   ├── invoices/        # Invoice list + detail
│   │   ├── reports/         # Laporan (5 tab)
│   │   ├── master/          # Services, drugs, products, stock
│   │   ├── audit-logs/      # Audit trail viewer
│   │   ├── notifications/   # Notification center
│   │   └── settings/        # Company, tax, payment, numbering
│   ├── (portal)/            # Customer portal (horizontal nav)
│   │   └── portal/
│   │       ├── dashboard/   # Pet cards, recent visits, pending invoices
│   │       ├── pets/        # My pets CRUD
│   │       ├── visits/      # Visit history + detail
│   │       ├── prescriptions/ # Prescription list + detail
│   │       ├── invoices/    # Invoice list + detail
│   │       └── profile/     # Edit profile + change password
│   ├── api/
│   │   ├── auth/            # NextAuth routes + reset-password
│   │   ├── health/          # Health check endpoint
│   │   ├── notifications/   # Mark read, mark all read
│   │   └── upload/          # File upload (Supabase Storage)
│   └── layout.tsx           # Root layout
├── components/
│   ├── layout/              # Sidebar, navbar, providers, theme-provider
│   ├── shared/              # StatusBadge, SearchInput, NotificationBell, ThemeToggle, CustomerTabs
│   ├── charts/              # Revenue chart, visits chart
│   ├── cards/               # Stat cards
│   └── ui/                  # shadcn/ui components
├── server/
│   ├── actions/             # Server actions (mutations)
│   │   ├── auth.ts          # Login, logout, forgot/reset password
│   │   ├── customers.ts     # Customer CRUD
│   │   ├── pets.ts          # Pet CRUD
│   │   ├── visits.ts        # Visit create/update/complete
│   │   ├── billings.ts      # Billing CRUD + complete
│   │   ├── invoices.ts      # Payment, email invoice
│   │   ├── pos.ts           # POS order + checkout
│   │   ├── services.ts      # Master data CRUD (services, drugs, products, categories)
│   │   ├── stock.ts         # Stock adjustment
│   │   ├── users.ts         # User management
│   │   ├── settings.ts      # Settings update
│   │   ├── queries.ts       # Query wrappers (with auth checks)
│   │   └── uploads.ts       # File upload/delete
│   ├── queries/             # Database query functions
│   │   ├── index.ts         # Centralized queries
│   │   ├── customers.ts     # Customer queries
│   │   └── visits.ts        # Visit queries
│   └── lib/                 # Server utilities
│       ├── auth.ts          # NextAuth configuration
│       ├── prisma.ts        # Prisma client (driver adapter)
│       ├── email.ts         # Email templates + Resend sender
│       ├── audit.ts         # Audit log helper
│       ├── notifications.ts # Notification helpers + low stock alert
│       └── storage.ts       # Supabase Storage client
├── lib/
│   ├── utils.ts             # Utility functions (formatCurrency, number generation, etc.)
│   ├── constants.ts         # Navigation items, species, payment methods
│   ├── validators.ts        # Zod schemas for all forms
│   └── errors.ts            # Custom error classes
├── types/
│   └── index.ts             # TypeScript types and helpers
└── middleware.ts             # Route protection (cookie-based)
```

## Arsitektur

### Server-First Pattern

- **React Server Components** — Halaman server mengambil data langsung dari Prisma
- **Server Actions** — Semua mutasi menggunakan server actions dengan validasi Zod
- **Action Layer** — `src/server/actions/` membungkus query layer `src/server/queries/`
- **Client Components** — Hanya untuk interaktivitas (forms, dialogs, real-time UI)

### Security

- **Authentication** — NextAuth 5 dengan Credentials provider + JWT
- **Authorization** — Role-based: OWNER > DOKTER/KASIR > CUSTOMER
- **Data Isolation** — Portal customer hanya bisa mengakses data sendiri (filter `userId`)
- **Input Validation** — Semua input divalidasi dengan Zod di server-side
- **Account Lockout** — 5 percobaan gagal → terkunci 30 menit
- **Audit Trail** — Semua operasi CRUD tercatat dengan old/new values

### Middleware Route Protection

| Route | OWNER | DOKTER | KASIR | ADMIN | CUSTOMER |
|-------|-------|--------|-------|-------|----------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/master/*` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `/settings/*` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `/pos` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `/reports` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `/audit-logs` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/portal/*` | ❌ | ❌ | ❌ | ❌ | ✅ |

## Deployment

### Vercel + Supabase

1. Push ke GitHub repository
2. Import project di Vercel
3. Set environment variables di Vercel dashboard
4. Deploy — Vercel akan menjalankan `prisma migrate deploy` otomatis

### Manual Deployment

```bash
# Build
pnpm build

# Database migration
pnpm db:migrate:deploy

# Seed (opsional, first deploy only)
pnpm db:seed

# Start
pnpm start
```

## Email Templates

Semua email dikirim via Resend dengan HTML templates:

| Email | Trigger |
|-------|---------|
| Welcome + temp password | Customer registration |
| Visit completed | Visit status → COMPLETED |
| Invoice generated | Auto-generated from visit/billing |
| Payment confirmation | Payment processed |
| Password reset | Forgot password request |
| Low stock alert | Product stock ≤ reorder point |

## License

Private — Internal use only.
