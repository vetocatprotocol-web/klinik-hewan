# HALAND PETCARE - DEPLOYMENT & MONITORING

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

**END OF DOCUMENT**
