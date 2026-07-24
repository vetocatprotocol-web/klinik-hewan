# HALAND PETCARE - FRONTEND & UI/UX SPECIFICATION

---

## 1. RESPONSIVE & MOBILE-FIRST DESIGN

### 1.1 Breakpoint System

| Breakpoint | Tailwind Class | Viewport | Target |
|---|---|---|---|
| Mobile (default) | (none) | 0 - 639px | Primary for customer portal |
| Tablet | sm: | 640px+ | Secondary for dashboard |
| Desktop | lg: | 1024px+ | Primary for admin/staff |
| Wide | xl: | 1280px+ | Enhanced dashboard views |

### 1.2 Mobile-First Strategy

- All components built mobile-first with progressive enhancement
- Customer portal designed primarily for mobile access (primary access device)
- Admin dashboard accessible on tablet but optimized for desktop
- POS module adapts: side-by-side on desktop, stacked on mobile/tablet

### 1.3 Responsive Patterns

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Admin Sidebar | Hidden, hamburger trigger via Sheet | Collapsed to icons | Visible, collapsible |
| Data Tables | Card list layout | Compact table | Full table with pagination |
| Forms | Single column, full width | Single column, centered | Single column, max-width |
| Dashboard Stats | 1 column, stacked | 2 columns | 4 columns |
| Dashboard Charts | Full width | Full width | Side-by-side |
| POS Layout | Stacked (catalog → cart) | Stacked | Side-by-side |
| Portal Navigation | Bottom tab bar or hamburger | Top navbar | Top navbar |
| Dialogs/Modals | Full-screen on mobile | Centered modal | Centered modal |
| Page Headers | Stacked title + actions | Inline title + actions | Inline title + actions |

### 1.4 Touch Targets

- All interactive elements minimum 44x44px touch target
- Adequate spacing between interactive elements (minimum 8px gap)
- Swipe gestures not required (all actions via buttons)
- Pull-to-refresh not implemented (manual refresh via button)

---

## 2. DARK MODE TOGGLE

### 2.1 Implementation

- Toggle accessible via top navbar (sun/moon icon button)
- Persisted in localStorage, applied on initial load
- Respects system preference on first visit (`prefers-color-scheme`)
- Uses shadcn/ui built-in dark mode support with CSS variables

### 2.2 Color Adaptation

| Element | Light Mode | Dark Mode |
|---|---|---|
| Background | hsl(0, 0%, 100%) | hsl(224, 71%, 4%) |
| Foreground | hsl(224, 71%, 4%) | hsl(0, 0%, 98%) |
| Card | hsl(0, 0%, 100%) | hsl(224, 71%, 8%) |
| Muted | hsl(220, 14%, 96%) | hsl(220, 14%, 12%) |
| Border | hsl(220, 13%, 91%) | hsl(220, 14%, 16%) |
| Primary | hsl(221, 83%, 53%) | hsl(221, 83%, 63%) |
| Destructive | hsl(0, 84%, 60%) | hsl(0, 84%, 66%) |
| Warning | hsl(38, 92%, 50%) | hsl(38, 92%, 58%) |

### 2.3 Components Affected

- All shadcn/ui components auto-adapt via CSS variables
- Charts: explicit color handling for both themes
- PDF preview: light background always (print-like)
- Status badges: consistent visibility in both themes
- Form inputs: adequate contrast in both themes
- Sidebar: background adapts, text remains readable

---

## 3. SHADCN/UI + TAILWIND CSS USAGE

### 3.1 Component Sourcing

All UI components from shadcn/ui with project-specific customizations. Components installed via CLI, NOT hand-copied:

```bash
npx shadcn-ui@latest add button card dialog input select table badge ...
```

### 3.2 Custom Theme

Extended Tailwind config with project-specific tokens:

```typescript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
}
```

### 3.3 Component Usage Map

| Feature | shadcn/ui Components | Custom Extensions |
|---|---|---|
| Login | Card, Input, Button, Checkbox, Label | Centered layout wrapper |
| Dashboard | Card, Badge, Separator | Stat card, Chart wrapper |
| Data Tables | Table, Input, Select, Button, Pagination, DropdownMenu, Badge | data-table.tsx, data-table-toolbar.tsx, data-table-pagination.tsx |
| Forms | Form, Input, Select, Textarea, Label, Button, Dialog | Form wrapper with react-hook-form |
| POS | Input, Button, Select, Badge, Separator | Product grid, Cart component |
| Navigation | Sheet, Button, Avatar, Badge, DropdownMenu | sidebar.tsx, navbar.tsx |
| Notifications | Button, Badge, ScrollArea, Separator | notification-bell.tsx |
| Settings | Input, Select, Switch, Tabs, Button, Label | Tabbed settings form |
| Portal | Card, Badge, Button, Input, Select, Tabs | Mobile-optimized cards |

---

## 4. UI COMPONENTS & PATTERNS

### 4.1 Data Table Pattern

All list views use a consistent data table pattern:

```
<DataTableToolbar>
  <SearchInput />           // Debounced search (300ms)
  <FilterSelects />        // Status, category, date range filters
  <CreateButton />         // Role-gated creation action
</DataTableToolbar>

<DataTable>
  <TableHeader />          // Sortable column headers
  <TableBody>              // Paginated rows
    <TableRow />
    <TableEmpty />         // Empty state with CTA
  </TableBody>
  <DataTablePagination />  // Page controls, per-page selector
</DataTable>
```

### 4.2 Form Pattern

All forms follow consistent structure:

```
<FormProvider>                    // react-hook-form context
  <FormField>                    // For each field
    <Label />
    <Input / Select / Textarea />
    <FormMessage />              // Inline validation error
  </FormField>
  
  <FormActions>
    <Button variant="outline">Cancel</Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? <Spinner /> : "Save"}
    </Button>
  </FormActions>
</FormProvider>
```

### 4.3 Card Pattern

Dashboard and portal use consistent card layouts:

```
<Card>
  <CardHeader>
    <CardTitle />
    <CardDescription />
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### 4.4 Modal/Dialog Pattern

```
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogHeader>
    <DialogTitle />
    <DialogDescription />
  </DialogHeader>
  <DialogContent>
    {/* Form or content */}
  </DialogContent>
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Confirm</Button>
  </DialogFooter>
</Dialog>
```

### 4.5 Confirmation Dialog Pattern

```
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Archive</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 5. CLIENT-SIDE STATE MANAGEMENT

### 5.1 State Strategy

| State Type | Solution | Examples |
|---|---|---|
| Server data | React Server Components + TanStack Query | Lists, detail views, dashboard stats |
| Form state | react-hook-form | All form inputs |
| UI state | React useState/useReducer | Modal open/close, active tab, sidebar collapsed |
| URL state | Next.js searchParams | Filters, pagination, sort |
| Global auth state | Auth.js session (server-side) | Current user, role |
| Persistent UI | localStorage | Dark mode, sidebar state |

### 5.2 TanStack Query Usage

Used for client-side data that requires:
- Automatic refetching (e.g., dashboard stats polling)
- Optimistic updates (e.g., adding items to cart)
- Dependent queries (e.g., customer → pets)

NOT used for:
- Server Component pages (data fetched directly)
- One-time loads (no refetch needed)
- Form submissions (use Server Actions directly)

### 5.3 Optimistic Updates Pattern

```typescript
// Example: Adding item to POS cart
const addItem = useMutation({
  mutationFn: addPosItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ['cart'] })
    const previous = queryClient.getQueryData(['cart'])
    queryClient.setQueryData(['cart'], (old) => [...old, newItem])
    return { previous }
  },
  onError: (err, newItem, context) => {
    queryClient.setQueryData(['cart'], context.previous)
    toast.error("Failed to add item")
  },
})
```

---

## 6. FORM HANDLING WITH REACT-HOOK-FORM + ZOD

### 6.1 Schema-First Approach

All validation schemas defined once, shared between client and server:

```typescript
// lib/validators.ts
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().min(10, "Phone must be 10+ digits").max(20),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
```

### 6.2 Server Action Integration

Server Actions validate server-side using the same schema:

```typescript
"use server"
export async function createCustomer(input: CreateCustomerInput) {
  const validated = createCustomerSchema.parse(input)
  // ... business logic
}
```

### 6.3 Client Form Integration

```typescript
"use client"
const form = useForm<CreateCustomerInput>({
  resolver: zodResolver(createCustomerSchema),
  defaultValues: { name: "", phone: "", email: "", address: "" },
})

async function onSubmit(data: CreateCustomerInput) {
  const result = await createCustomer(data)
  if (result.success) router.push(`/customers/${result.data.id}`)
  else if (result.error.field) form.setError(result.error.field, { message: result.error.message })
  else toast.error(result.error.message)
}
```

### 6.4 Validation Patterns

| Pattern | Implementation |
|---|---|
| Required fields | z.string().min(1, "Required") |
| Email validation | z.string().email("Invalid email") |
| Phone validation | z.string().min(10).max(20).regex(/^\d+$/, "Numbers only") |
| Unique fields | Server-side check in Server Action, return CONFLICT error |
| Cross-field validation | z.object with .refine() |
| Conditional required | z.union([z.string().min(1), z.literal("")]) for optional email |
| Number validation | z.number().min(0).max(999999999) |
| Enum validation | z.nativeEnum(EnumType) |

---

## 7. LAYOUT & NAVIGATION PATTERNS

### 7.1 Route Groups

| Route Group | Purpose | Layout |
|---|---|---|
| `(auth)` | Login, register | Centered card layout |
| `(dashboard)` | Admin/staff pages | Sidebar + navbar layout |
| `(portal)` | Customer portal | Portal navbar layout |

### 7.2 Navigation Hierarchy

```
/ (redirect to /dashboard or /portal/dashboard based on role)

/dashboard                    # Owner only
/customers                    # Owner, Doctor, Cashier
/customers/new
/customers/[id]
/customers/[id]/edit
/customers/[id]/pets/new
/customers/[id]/pets/[petId]/edit
/visits                       # Owner, Doctor, Cashier
/visits/new
/visits/[id]
/visits/[id]/edit
/billings                     # Owner, Doctor, Cashier
/billings/new
/billings/[id]
/pos                          # Cashier
/invoices                     # Owner, Cashier
/invoices/[id]
/master/services              # Owner
/master/drugs                 # Owner
/master/products              # Owner
/master/stock                 # Owner, Admin
/reports                      # Owner
/settings                     # Owner
/settings/users               # Owner
/notifications                # All authenticated

/portal/dashboard             # Customer
/portal/pets                  # Customer
/portal/pets/new
/portal/pets/[id]
/portal/pets/[id]/edit
/portal/visits                # Customer
/portal/invoices              # Customer
/portal/prescriptions         # Customer
/portal/profile               # Customer
```

### 7.3 Breadcrumb Navigation

All pages below the first level show breadcrumbs:

```
Customers > Customer Name > Pets > New Pet
Visits > VIS-2026-0115-00001
Master Data > Services
Settings > Users
Portal > My Pets > Pet Name
```

### 7.4 Loading States

Each page defines its own loading state via Next.js loading.tsx:

```
app/(dashboard)/customers/loading.tsx    # Table skeleton
app/(dashboard)/customers/[id]/loading.tsx  # Detail skeleton
app/(dashboard)/visits/new/loading.tsx   # Form skeleton
app/(dashboard)/dashboard/loading.tsx    # Stats + chart skeletons
```

---

## 8. ACCESSIBILITY

### 8.1 Semantic HTML

- Proper heading hierarchy (h1 > h2 > h3)
- Landmark elements (nav, main, aside, header, footer)
- Lists for navigation items
- Tables with proper th, scope attributes

### 8.2 Keyboard Navigation

- All interactive elements focusable via Tab
- Focus ring visible on all focusable elements (ring-2 ring-ring)
- Enter/Space activates buttons and links
- Escape closes modals and dropdowns
- Arrow keys navigate within menus and select dropdowns
- Skip-to-content link as first focusable element

### 8.3 Screen Reader Support

- All images have descriptive alt text
- Form inputs have associated labels (htmlFor)
- Error messages linked via aria-describedby
- Status changes announced via aria-live
- Loading states indicated via aria-busy

### 8.4 Color & Contrast

- All text meets WCAG 2.1 AA contrast ratio (4.5:1 normal, 3:1 large)
- Information not conveyed by color alone (icons + text + color)
- Focus indicators meet contrast requirements
- Dark mode maintains contrast ratios

### 8.5 ARIA Patterns

| Component | ARIA Pattern |
|---|---|
| Dialog | role="dialog", aria-modal="true", aria-labelledby |
| Navigation | role="navigation", aria-label |
| Data table | scope="col" for headers, aria-sort for sorted columns |
| Form errors | aria-describedby, aria-invalid="true" |
| Loading | aria-busy="true", aria-live="polite" |
| Badge/Status | aria-label for non-text status indicators |

---

## 9. ANIMATIONS & TRANSITIONS

### 9.1 Transition Strategy

- Minimal, purposeful animations only
- Consistent duration: 150ms (fast), 200ms (normal), 300ms (slow)
- Ease: ease-in-out for most transitions
- Respect `prefers-reduced-motion` media query

### 9.2 Animated Components

| Component | Animation | Duration |
|---|---|---|
| Dialog/Modal | Fade in + scale | 200ms |
| Toast | Slide in from top-right | 300ms |
| Sidebar collapse | Width transition | 200ms |
| Page transitions | None (server navigation) | N/A |
| Hover states | Background color | 150ms |
| Button press | Scale(0.98) | 100ms |
| Skeleton pulse | Opacity animation | 2s infinite |
| Loading spinner | Rotate 360deg | 1s infinite |

### 9.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. PDF EXPORT / INVOICE GENERATION UI

### 10.1 Invoice PDF

- Download button on invoice detail page
- Generated server-side (e.g., @react-pdf/renderer or puppeteer)
- Includes: clinic header (logo, name, address), invoice number, date, customer info, pet info, items table, subtotal, tax, discount, total, paid amount, remaining, payment history, footer notes
- A4 paper size, print-optimized layout
- File naming: `INV-YYYY-MMDD-XXXXX.pdf`

### 10.2 Prescription PDF

- Download button on prescription detail / visit detail
- Includes: clinic header, prescription number, date, customer info, pet info, doctor name, drug items table (drug name, quantity, dosage, duration, instructions), footer
- A5 or letter size
- File naming: `RX-YYYY-MMDD-XXXXX.pdf`

### 10.3 Receipt PDF (POS)

- Auto-generated after POS checkout
- Thermal receipt format (80mm width option)
- Includes: clinic header, receipt number, date, items, subtotal, tax, discount, total, payment method, change, cashier name
- Print dialog triggered after generation

### 10.4 Visit Notes PDF

- Export button on visit detail (Doctor role)
- Includes: clinic header, visit number, date, customer/pet info, chief complaint, physical exam, diagnosis, treatment notes, vital signs, services, drugs prescribed
- A4 paper size

---

## 11. LOW-STOCK ALERTS UI

### 11.1 Dashboard Widget

- Card on owner dashboard showing products below reorder point
- Badge count for total low-stock items
- Each item shows: product name, current stock, reorder point
- Clickable to navigate to stock management page

### 11.2 Stock Management Page

- Filter toggle for "Low Stock Only"
- Visual indicator (red badge/row highlight) for low-stock products
- Inline stock adjustment button

### 11.3 Notification

- Low-stock event triggers in-app notification to Owner
- Email notification sent via Resend
- Notification includes: product name, current stock, reorder point

---

## 12. NOTIFICATION BELL UI

### 12.1 Component

- Bell icon in top navbar
- Unread count badge (red circle with number, max 99+)
- Click opens dropdown/popover with notification list

### 12.2 Notification List

- Scrollable list (max height 400px)
- Each notification: icon (based on type), message text, relative time (e.g., "2h ago"), read/unread indicator
- Unread notifications have bold text + blue dot
- Click marks as read and navigates to relevant page (if applicable)

### 12.3 Actions

- "Mark all as read" button at top
- Individual click marks as read
- Auto-dismiss after 7 days (server-side cleanup)
- Empty state: "No notifications"

---

## 13. DASHBOARD CHARTS & STATS UI

### 13.1 Stats Cards

- 4 stat cards in a row (1 column on mobile, 2 on tablet, 4 on desktop)
- Each card: icon, label, value, trend indicator (up/down arrow with percentage)
- Cards: Today's Visits, Today's Revenue, Pending Payments, Low Stock Count

### 13.2 Visits Trend Chart

- Line chart showing visit count for last 7 days
- X-axis: dates, Y-axis: visit count
- Responsive: full-width on all viewports
- Hover tooltip with exact count

### 13.3 Revenue Trend Chart

- Bar chart showing daily revenue for last 30 days
- X-axis: dates, Y-axis: revenue amount
- Formatted as currency
- Responsive: full-width on all viewports

### 13.4 Pending Actions

- List of actionable items requiring attention
- Items: unpaid invoices (count + total amount), incomplete visits (count), low stock products (count)
- Each item clickable to navigate to relevant page

### 13.5 Recent Transactions

- Table of latest 10 transactions (visits + payments)
- Columns: date, type, customer, amount, status
- "View all" link to full list

### 13.6 Chart Library

- Use a lightweight charting solution compatible with React Server Components
- Charts loaded as Client Components with dynamic import
- Consistent theming with CSS variables for light/dark mode
- Responsive sizing with container queries

---

## 14. PORTAL EXPERIENCE DESIGN

### 14.1 Portal-First Mobile Design

The customer portal is designed primarily for mobile access:

- Touch-friendly interface with large tap targets
- Bottom navigation bar on mobile (Dashboard, Pets, Visits, Invoices, More)
- Swipeable cards for pet information
- Pull-down to refresh data
- Full-width buttons and inputs

### 14.2 Portal Layout

```
┌─────────────────────────────────────────────────┐
│ TOP NAVBAR                                      │
│ [Logo]           [Notifications] [Profile]      │
├─────────────────────────────────────────────────┤
│                                                 │
│ MAIN CONTENT                                    │
│ - Greeting: "Hello, [Name]"                     │
│ - Quick Actions: View Pets, View Invoices       │
│ - Recent Activity Feed                          │
│                                                 │
├─────────────────────────────────────────────────┤
│ BOTTOM NAV (mobile only)                        │
│ [Dashboard] [Pets] [Visits] [Invoices] [More]   │
└─────────────────────────────────────────────────┘
```

### 14.3 Portal Pages

| Page | Key UI Elements |
|---|---|
| Dashboard | Pet cards, recent visits timeline, unpaid invoice alerts |
| My Pets | Pet cards grid, add pet button, pet detail view |
| Pet Detail | Pet info card, visit history timeline, medical records |
| Visit History | Filter bar, visit cards with status badges |
| Visit Detail | Full medical record view, download buttons |
| Invoices | Invoice list with status filters, download buttons |
| Invoice Detail | Printable invoice view, download PDF |
| Prescriptions | Prescription list, download PDF |
| Profile | Edit form, change password section |

### 14.4 Portal Navigation

- Desktop: top navbar with horizontal links
- Mobile: bottom tab bar with 5 main sections
- "More" tab on mobile expands to show: Prescriptions, Profile, Logout
- Active tab highlighted with primary color
- Badge on Invoices tab if unpaid invoices exist

---

**END OF DOCUMENT**
