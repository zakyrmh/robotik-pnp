<!-- AGENTS.md — Universal AI Agent Config & System Engineering Manual -->
<!-- Target Engines: Antigravity, Jules (Google), Claude Code, Codex CLI, Cursor, Next.js 16.2.x -->

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before executing any Next.js work, locate and read the relevant documentation
in `node_modules/next/dist/docs/` or using the context tools. Your pre-training
may be outdated — the current docs and source specifications are the ground truth.

<!-- END:nextjs-agent-rules -->

---

# 1. Project Overview & Identity

- **Project Name:** Student Activity Unit Management System — UKM Robotik Politeknik Negeri Padang (_Sistem Informasi Manajemen UKM Robotik PNP_)
- **Domain:** SaaS Web Application for organizational governance, recruitment pipelines, laboratory shift rotations, event presence, disciplinary tracking, and administrative audit trails.
- **Architectural Paradigm:** Server-First Fullstack SaaS using Next.js 16 (App Router, no `src/` directory), React 19, Supabase (PostgreSQL + Auth SSR + Storage), Tailwind CSS v4, Upstash Redis, and Cloudflare Turnstile.
- **Language & Standards:** TypeScript in strict mode (`strict: true`), ESLint 9 (Flat Config), Prettier, Conventional Commits.

---

# 2. Exact Tech Stack & Dependency Matrix

| Layer / Technology            | Package / Version                                                                                       | Architectural Role & Implementation Details                                                 |
| :---------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| **Framework**                 | `next@16.2.5`                                                                                           | App Router, Server Components by default, async `params`/`searchParams`, Server Actions.    |
| **UI Runtime**                | `react@19.2.4` / `react-dom@19.2.4`                                                                     | React 19 features (`useActionState`, `useFormStatus`, direct `ref` prop — NO `forwardRef`). |
| **Styling**                   | `tailwindcss@^4` + `@tailwindcss/postcss@^4`                                                            | CSS-First config via `@theme` in `app/globals.css`. **NO `tailwind.config.js`**.            |
| **Database & Auth**           | `@supabase/supabase-js@^2.105.3` + `@supabase/ssr@^0.10.2`                                              | PostgreSQL with 100% RLS, SSR Auth cookies, always `getUser()` (NEVER `getSession()`).      |
| **Validation**                | `zod@^4.4.3`                                                                                            | Inbound DTO & schema validation for all Server Actions and forms.                           |
| **Rate Limiting & Cache**     | `@upstash/redis@^1.38.0` + `@upstash/ratelimit@^2.0.8`                                                  | Distributed rate limiting on auth, scan endpoints, and sensitive server actions.            |
| **Security & Bot Protection** | `@marsidev/react-turnstile@^1.5.3`                                                                      | Cloudflare Turnstile widget on authentication and public registration forms.                |
| **Monitoring & Telemetry**    | `@sentry/nextjs@^10.69.0`                                                                               | Global error tracking, performance transactions, and trace propagation.                     |
| **Design System & Icons**     | `shadcn@^4.7.0`, `radix-ui@^1.4.3`, `lucide-react@^1.21.0`, `@hugeicons/react@^1.1.6`, `sonner@^2.0.7`  | Accessible primitives, minimalist soft theme tokens, toast notifications.                   |
| **Motion & Animation**        | `framer-motion@^12.38.0` + `tw-animate-css@^1.4.0`                                                      | Purposeful micro-interactions, spring transitions, drawer/modal animations.                 |
| **Scanner & Media**           | `html5-qrcode@^2.3.8`, `browser-image-compression@^2.0.2`, `react-easy-crop@^5.5.7`                     | QR presence scanner, client-side photo compression & avatar cropper.                        |
| **Testing & Tooling**         | `vitest@^4.1.6`, `@testing-library/react@^16.3.2`, `jsdom@^29.1.1`, `fast-check@^4.8.0`, `husky@^9.1.7` | Unit, integration & property-based testing. Quality gate $\ge 70\%$ coverage.               |

---

# 3. Role-Based Access Control (RBAC) & Permission Matrix

The system enforces strict access boundaries across 5 core roles. All Route Handlers, Server Actions, and UI Views must validate these roles against server-verified sessions:

| Role                             | Identifiers    | Scope & Responsibilities                                                                                                                                |
| :------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Super Admin**                  | `super-admin`  | Full system control, account lifecycle management, role promotions, system configuration, and audit log inspection.                                     |
| **Organizational Admin**         | `admin-or`     | Day-to-day organizational activities, Open Recruitment (Oprec) windows, structural divisions, achievement tracking, and activity sessions.              |
| **Disciplinary Committee Admin** | `admin-komdis` | Candidate evaluations, disciplinary sanctions (SP), group allocations, shift rotations (piket), presence validation, and denda management.              |
| **Active Member**                | `anggota`      | View organizational agenda, participate in mentorship/internship evaluation, log attendance via dynamic QR, and manage member profiles.                 |
| **Candidate Member**             | `caang`        | Restricted access for Open Recruitment progression, profile onboarding, designated group viewing, assigned shift (piket) tasks, and logbook submission. |

### Operational Workflow RBAC Matrix (`docs/04-process-view/workflow-documentation.md`)

| Code        | Action / Workflow Step                      | Super Admin | Admin-OR | Admin-Komdis | Anggota | Caang |
| :---------- | :------------------------------------------ | :---------: | :------: | :----------: | :-----: | :---: |
| `WF-ATT-01` | Create Activity / QR Session                |     [x]     |   [x]    |     [x]      |   [-]   |  [-]  |
| `WF-ATT-02` | Scan Dynamic Attendance QR                  |     [x]     |   [x]    |     [x]      |   [x]   |  [x]  |
| `WF-ATT-03` | Approve Attendance Leave (Izin/Sakit)       |     [x]     |   [-]    |     [x]      |   [-]   |  [-]  |
| `WF-PIK-01` | Schedule Laboratory Shifts (Piket)          |     [x]     |   [-]    |     [x]      |   [-]   |  [-]  |
| `WF-PIK-02` | Upload Shift Photo Evidence                 |     [-]     |   [-]    |     [-]      |   [-]   |  [x]  |
| `WF-PIK-03` | Verify Shift & Impose Fine (Denda Rp10.000) |     [x]     |   [-]    |     [x]      |   [-]   |  [-]  |
| `WF-REC-01` | Publish Open Recruitment Window             |     [x]     |   [x]    |     [-]      |   [-]   |  [-]  |
| `WF-REC-02` | Document Screening & Interview Scoring      |     [x]     |   [x]    |     [x]      |   [-]   |  [-]  |
| `WF-REC-03` | Upload Signed Member Decree (SK Pelantikan) |     [x]     |   [x]    |     [-]      |   [-]   |  [-]  |

---

# 4. Project Architecture & Codebase Map

```
robotik-pnp/
├── app/                              # Next.js App Router (Server-First by default)
│   ├── (auth)/                       # Auth routes (login, register, forgot/update password, verify)
│   ├── (marketing)/                  # Public landing pages (artikel, divisi, prestasi, keanggotaan, profil)
│   ├── (onboarding-flow)/            # Post-registration onboarding (waiting, rejected, deleted)
│   ├── (private)/                    # Protected application portals (RBAC guarded)
│   │   ├── dashboard/                # Main role-specific dashboard
│   │   ├── kegiatan/                 # Activity sessions & general attendance
│   │   ├── kegiatan-absensi-caang/   # Candidate dynamic QR scan & presence management
│   │   ├── piket/                    # Laboratory shift scheduling & verification
│   │   ├── manajemen-caang/          # Recruitment applicant evaluation
│   │   ├── manajemen-kelompok/       # Mentorship group assignments
│   │   ├── manajemen-struktur/       # Organizational leadership tree
│   │   ├── manajemen-akun/           # User administration
│   │   ├── audit-log/                # Immutable security & mutation logs
│   │   └── kedisiplinan/             # Points, disciplinary records & sanctions (SP)
│   ├── api/                          # Edge/webhook route handlers ONLY (no form mutations)
│   ├── globals.css                   # Tailwind CSS v4 @theme design tokens
│   └── layout.tsx                    # Root layout with Toast, Sentry, and Analytics providers
├── components/                       # UI Components (shadcn/ui primitives & feature atomic units)
│   └── ui/                           # Reusable base components (buttons, dialogs, tables, cards)
├── hooks/                            # Custom client hooks (QR scanning, camera, media)
├── lib/
│   ├── actions/                      # Secure Next.js Server Actions ('use server')
│   ├── repositories/                 # Data access layer & domain services
│   ├── schemas/                      # Zod validation schemas for all inputs
│   ├── supabase/                     # Supabase client factories
│   │   ├── server.ts                 # createServerClient factory for RSC & Server Actions
│   │   ├── client.ts                 # createBrowserClient factory for Client Components
│   │   └── proxy.ts                  # Middleware session gatekeeper
│   ├── redis.ts                      # Upstash Redis & RateLimiter instances
│   ├── turnstile.ts                  # Cloudflare Turnstile token verification
│   └── utils.ts                      # cn() helper (clsx + tailwind-merge)
├── types/                            # Global TypeScript types & Supabase generated database types
├── docs/                             # Full architectural & compliance documentation (01 to 08)
└── supabase/
    └── migrations/                   # Tracked SQL database migrations with strict RLS
```

---

# 5. Core Business Logic & Domain Constraints

AI Agents must strictly adhere to the functional requirements of all core modules:

1. **Authentication & Identity Parity:**
   - During candidate signup and profile creation, the generated user profile `id` (`UUID`) MUST match the corresponding registration document identifier 1:1.
   - Never trust client-supplied `user_id`; always resolve identity via `supabase.auth.getUser()`.

2. **Open Recruitment (Oprec) & Progression:**
   - Multi-phase flow: Registration & Document Screening $\rightarrow$ Interview (Org & Technical) $\rightarrow$ Divisional Allocation $\rightarrow$ Training & Robotics Internship $\rightarrow$ Plenary Evaluation $\rightarrow$ Official Member Decree (SK).

3. **Digital Attendance & Dynamic QR Rotation:**
   - Formal activities generate a dynamic QR code token (`ukmrobotik:qr:session`) refreshed every 30 seconds to prevent unauthorized screenshot sharing.
   - Attendance scoring: Hadir (+10), Late Tolerance (+7.5), Late >15m (+5), Izin/Sakit (+5), Alpha (0).
   - Point infractions trigger automatic Draft Disciplinary Warning Letters (SP) reviewed by `admin-komdis`.

4. **Laboratory Shift Duty (Manajemen Piket):**
   - Shift rotations are scheduled by `admin-komdis`.
   - Automated H-1 reminder triggers at 18:00 WIB via scheduled cron.
   - Shift personnel must upload clean lab photo proof to the private `piket-proofs` bucket.
   - Missed shift (_Alpha_) or rejected proof incurs an automatic fine of **Rp10.000** and penalty points.

5. **Immutable Audit Trails (Multi-Layer Immutability):**
   - Every administrative write or mutation (INSERT, UPDATE, DELETE) by `super-admin`, `admin-or`, or `admin-komdis` MUST create an immutable log record in `public.audit_logs`.
   - The `public.audit_logs` table is protected by a PostgreSQL trigger preventing any `UPDATE` or `DELETE`.
   - Log entries adhere to Schema JSON v2.0 (timestamp UTC ISO 8601, actor ID, action, target entity, details, correlation ID).
   - Personal Identifiable Information (PII) must be masked (NIM `210109****`, Phone `0812-****-5678`, Email `u***r@domain.com`). Raw passwords and auth tokens are forbidden in logs.

---

# 6. Frontend & UI/UX Design System (`DESIGN.md` Standard)

The application follows the **Minimalist Soft (Light)** design aesthetic:

### Color Palette (70-20-10 Rule)

- **70% Neutral:** Canvas White (`#ffffff` / `--color-canvas`) and Surface Muted (`#f8fafc` / `--color-surface`) for backgrounds, cards, and zebra-striped tables. Border is 1px `--color-border` (`#e5e7eb`).
- **20% Primary:** Soft Navy (`#3b5b84` / `--color-primary`), Hover (`#2f4a6d` / `--color-primary-hover`), Soft Tint (`#eaf1f8` / `--color-primary-soft`) for brand identity, primary buttons, and key headings.
- **10% Accent:** Soft Orange PNP (`#f0975a` / `--color-accent`), Deep Accent (`#9a5b30` / `--color-accent-deep`), Tint (`#fdeee1` / `--color-accent-soft`) used sparingly for status badges, highlights, and alerts.

### Typography

- **Heading Font:** Plus Jakarta Sans (`--font-display`), Semibold (600), tracking-tight.
- **Body Font:** Inter (`--font-body`), Regular (400) for text, Medium (500) for labels/buttons, Semibold (600) for table headers.
- **Code/Technical Data:** System monospace (`--font-mono` / `ui-monospace`) for IDs, scores, and tokens.
- **Fluid Font Scale:** Configured using `clamp()` in CSS for seamless responsiveness across mobile and desktop.

### Touch Targets & Accessibility

- Interactive elements (buttons, inputs, links, dropdown triggers) must have a minimum touch target height of $44\text{ px}$ (`min-h-[44px]`).
- Reusable UI styling must always use the `cn()` helper (`@/lib/utils`).

---

# 7. AI Code Generation & Modern Stack Rules

### Next.js 16 & React 19 Standards

1. **Server Components Default:** All files in `app/` and `components/` are React Server Components (RSC) unless interactive hooks (`useState`, `useEffect`, `useActionState`) or browser APIs are required.
2. **Interleaving Pattern:** Keep `page.tsx` as an RSC for direct Supabase data fetching. Isolate interactive elements into small, client-leaf components marked with `'use client'`.
3. **Async `params` and `searchParams`:** Always `await` params and searchParams in Next.js 16:
   ```tsx
   export default async function Page({
     params,
   }: {
     params: Promise<{ id: string }>;
   }) {
     const { id } = await params;
     return <div>ID: {id}</div>;
   }
   ```
4. **React 19 `ref` Props:** **DO NOT USE `forwardRef`** (deprecated in React 19). Pass `ref` as a standard prop:
   ```tsx
   export function Input({
     ref,
     ...props
   }: React.ComponentPropsWithRef<"input">) {
     return <input ref={ref} {...props} />;
   }
   ```
5. **Form States:** Use React 19 `useActionState` and `useFormStatus` for managing Server Action pending and error states.

### Data Mutation & Server Actions

1. **Mutations via Server Actions:** All form submissions and data modifications MUST use Server Actions (`'use server'`). Do not create ad-hoc API routes for standard form submissions.
2. **Input Validation:** Every Server Action must validate incoming payloads using a **Zod schema** (`lib/schemas/*`) before performing database queries.
3. **Cache Revalidation:** Always invoke `revalidatePath('/path')` or `revalidateTag('tag-name')` upon successful mutation.
4. **Structured Return Types:** Always return typed objects:
   ```typescript
   export type ActionResult<T = unknown> =
     | { success: true; data: T; message?: string }
     | {
         success: false;
         error: string;
         fieldErrors?: Record<string, string[]>;
       };
   ```

### Supabase SSR Conventions

1. **Client Boundary Separation:**
   - Server-side (RSC, Route Handlers, Server Actions): `import { createClient } from "@/lib/supabase/server"`.
   - Client-side (Client Components): `import { createClient } from "@/lib/supabase/client"`.
   - NEVER interchange or import server Supabase factories into client components.
2. **Authentication Verification:** Always call `supabase.auth.getUser()`. **NEVER use `supabase.auth.getSession()` on the server** due to JWT spoofing vulnerabilities.
3. **Storage Uploads:** Compress images using `browser-image-compression` on the client before uploading to Supabase Storage. Enforce strict mime-type and size limits.

### Tailwind CSS v4 Rules

1. **CSS-First Theme Config:** All custom colors, font families, and tokens are declared in `app/globals.css` using `@theme`.
2. **DO NOT CREATE `tailwind.config.js`**. Tailwind v4 ignores JS config files.

---

# 8. Available Agent Skills & References Index

AI Agents should reference and execute the specialized skills installed in `.agents/skills/`:

| Skill Name                    | Location                                 | Primary Use Case                                                         |
| :---------------------------- | :--------------------------------------- | :----------------------------------------------------------------------- |
| `nextjs-best-practices`       | `.agents/skills/nextjs-best-practices`   | Next.js App Router RSC patterns, server data fetching, routing.          |
| `nextjs-supabase-auth`        | `.agents/skills/nextjs-supabase-auth`    | Supabase Auth SSR integration, middleware proxies, cookie handling.      |
| `shadcn`                      | `.agents/skills/shadcn`                  | Adding, configuring, and styling shadcn UI component primitives.         |
| `ask-sonner`                  | `.agents/skills/ask-sonner`              | Toast notification integration, themes, promise toasts, dismissals.      |
| `turnstile-spin`              | `.agents/skills/turnstile-spin`          | Cloudflare Turnstile CAPTCHA integration and server verification.        |
| `upstash`                     | `.agents/skills/upstash`                 | Redis rate limiting, caching strategies, sliding window algorithms.      |
| `animate` / `emil-design-eng` | `.agents/skills/animate`                 | Micro-interactions, spring physics, layout animations, polish.           |
| `design-taste-frontend`       | `.agents/skills/design-taste-frontend`   | Clean, non-templated editorial layouts adhering to `DESIGN.md`.          |
| `web-perf`                    | `.agents/skills/web-perf`                | Core Web Vitals (LCP, INP, CLS), render optimization, bundle audit.      |
| `full-output-enforcement`     | `.agents/skills/full-output-enforcement` | Exhaustive code generation, banning truncation and placeholder comments. |

---

# 9. Quality Assurance, Testing & Git Workflow

- **Testing Framework:** Vitest (`npm run test`), React Testing Library, and jsdom.
- **Property-Based Testing:** `fast-check` for testing complex algorithms (e.g., presence point calculations, fee generators).
- **Quality Gate:** Minimum test coverage threshold is strictly **$70\%$**.
- **Pre-commit Automation:** Husky + lint-staged runs `eslint --fix` and `prettier --write`.
- **Commit Standard:** Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`). Enforced by `@commitlint/cli`.
- **Pre-PR Verification:** Run `npm run typecheck`, `npm run lint`, and `npm run test` before submitting changes.

---

# 10. Strict Anti-Patterns & Banned Practices (AI Don'ts)

| ❌ BANNED ANTI-PATTERN                                                            | ✅ MANDATORY PRACTICE                                                             |
| :-------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| Adding `"use client"` at the top of a `page.tsx` file.                            | Keep `page.tsx` as a Server Component; move interactivity to leaf components.     |
| Accessing `params` or `searchParams` synchronously.                               | `await params` and `await searchParams` in Next.js 16.                            |
| Using `forwardRef` in custom input/button components.                             | Pass `ref` as a normal prop (`React.ComponentPropsWithRef<'input'>`) in React 19. |
| Creating or modifying a `tailwind.config.js` file.                                | Declare custom design tokens inside `@theme` in `app/globals.css`.                |
| Using `supabase.auth.getSession()` on the server.                                 | Always use `supabase.auth.getUser()` for cryptographic token re-verification.     |
| Querying the database directly from client components.                            | Use secure Server Actions with Zod validation.                                    |
| Using the native HTML `<img>` tag.                                                | Always use `next/image` (`Image` component) with explicit dimensions.             |
| Hardcoding secrets or using `NEXT_PUBLIC_` for service keys.                      | Store secrets in `.env.local` without `NEXT_PUBLIC_` prefix; never commit to Git. |
| Using TypeScript `any` type.                                                      | Use strict interfaces, generics, or `unknown` with runtime type narrowing.        |
| Emitting incomplete code with `// TODO: implement later` or placeholder comments. | Provide complete, production-ready, fully implemented code blocks.                |
