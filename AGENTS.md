<!-- AGENTS.md — Universal AI Agent Config -->
<!-- Read by: Jules (Google), Claude Code, Codex CLI, Next.js 16.2, Cursor -->

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc
in `node_modules/next/dist/docs/`. Your training data is
outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

---

# Project Context

- **Project Name:** Student Activity Unit Management System - UKM Robotik Politeknik Negeri Padang (Sistem Manajemen UKM Robotik PNP)
- **Tech Stack:** SaaS architecture using Next.js 16 (App Router) + Supabase.
- **Authentication:** Supabase Auth with Server-Side Rendering (SSR) support.
- **Database:** PostgreSQL hosted on Supabase.
- **Styling:** Tailwind CSS v4.
- **Language:** TypeScript in strict mode (`strict: true`).

# Role-Based Access Control (RBAC)

The system enforces strict access control across five primary user roles. All API route handlers, Server Actions, and UI views must validate these roles:

- `super-admin`: Complete system-wide control, full account management, and access to system-wide audit logs.
- `admin-or` (Organizational Admin): Manages day-to-day organizational activities, configures open recruitment settings, handles core activities, and logs member attendance.
- `admin-komdis` (Disciplinary Committee Admin): Manages candidate evaluation, structural discipline, candidate group assignments, and picket/shift rotations.
- `anggota` (Active Member): General access for active members to view schedules, participate in mentorship/internship evaluation, and log regular attendance.
- `caang` (Candidate Member / Calon Anggota): Restricted access dedicated to open recruitment steps, personal registration details, designated group viewing, assigned picket/shift schedules, and internship task tracking.

# Key Application Modules & Business Logic

AI Agents must strictly adhere to the constraints of these core modules:

1. **Authentication & Candidate Registration:** During the open recruitment or signup flow, ensure strict relational alignment: the unique record identifier (`id`) generated in the user profile table MUST exactly match the corresponding registration document identifier to maintain clean data mapping.
2. **Open Recruitment (Oprec) & Candidate Management:** Configurable system windows for open recruitment dates, candidate filtering, and status updates (`caang` progression).
3. **Group Management & Candidate Internships (Magang Caang):** Division of candidate members into collaborative groups, assignment of mentors from active members (`anggota`), and progress monitoring for robotic/programming projects.
4. **Activities & Attendance Logging:** Session management for regular training, robotics workshops, and mandatory meetings with automatic role-based signature validation.
5. **Picket & Shift Duty Management (Manajemen Piket):** Automation and generation of laboratory cleaning and equipment maintenance shifts for candidate members, overseen by `admin-komdis`.
6. **Account Control & System Audit Logs:** Every write or destructive mutation (INSERT, UPDATE, DELETE) initiated by an administrative role (`super-admin`, `admin-or`, `admin-komdis`) MUST trigger a non-nullable logging sequence saved to the system audit trails table.

# Architecture

- `app/` → Next.js App Router. Use Server Components by default.
- `app/api/` → API Route Handlers for webhooks or edge cases (NEVER use the deprecated `pages/api/` directory).
- `components/` → Shared reusable UI components built on top of shadcn/ui base primitives.
- `lib/supabase/` → Separated Supabase client initialization factories for server contexts and browser contexts.
- `lib/actions/` → Secure Next.js Server Actions handling business logic mutation (do NOT execute direct client-side fetch requests for internal data mutations).
- `types/` → Global TypeScript definitions, type intersections, and automatically generated Supabase DB schemas.

# Coding Rules

- **Server-First Mindset:** ALWAYS utilize React Server Components (RSC) unless interactive features (e.g., event listeners, hooks like `useState`, `useEffect`) are explicitly required.
- **Client Directives:** DO NOT declare `"use client"` at the top of a file unless client-side reactivity is strictly needed. Keep client components leaves at the bottom of the component tree.
- **Supabase Clients:** Keep strict boundary separation. Use `createServerClient` inside server components, route handlers, and server actions. Use `createBrowserClient` exclusively in client components. NEVER mix or exchange their instantiation.
- **Data Validation:** All Server Actions must forcefully validate inbound structures using `zod` schemas before executing database mutations.
- **Error Propagation:** Every Promise must be safely wrapped in try-catch-finally bounds. Implement robust logging for failures. NEVER leave an unhandled promise rejection.
- **Asset Optimization:** Use the `next/image` component for rendering all graphics and images. The native HTML `<img>` tag is explicitly banned due to optimization loss.

# Supabase & Storage Conventions

- **Row Level Security (RLS):** RLS MUST be explicitly active and enabled on every single table within the public schema. Write explicit select/insert/update policies mapping to user roles.
- **Database Migrations:** All schema adjustments, table creations, and functions must be tracked in `supabase/migrations/`. Manual data structure adjustments in the Supabase Cloud GUI Dashboard are strictly forbidden.
- **Type Generation:** Keep types pristine. Regenerate DB definitions after schema changes via: `npx supabase gen types typescript`.
- **Supabase Storage:** Use Supabase Storage buckets for uploading organizational files, robotics documentation, activity media, and recruitment proof. Implement strict upload size validations and bind object paths to user roles via RLS storage policies.
- **Edge Functions:** Deploy highly performance-sensitive, global low-latency procedures to `supabase/functions/` rather than native API routes if external webhook handling requires minimal overhead.

# Testing

- **Unit Testing Engine:** Vitest.
- **End-to-End (E2E) Testing Framework:** Playwright.
- **Pre-flight Checks:** Local validation requires executing `npm test` successfully before drafting any Pull Request.
- **Quality Gate:** Code coverage minimum target threshold is set strictly to 70%.

# What NOT to Do

- **Security Breeshes:** NEVER commit `.env.local`, system secrets, private credentials, or raw service keys to version control.
- **Type Safety:** NEVER use the `any` keyword in TypeScript. Utilize `unknown` or abstract generic definitions if dynamic structures are required.
- **Data Ingestion Leakage:** NEVER query the Supabase database directly from a Client Component using server keys or unrestricted paths.
- **Legacy Framework Elements:** DO NOT construct or utilize the `pages/` directory under any circumstance.
- **Dependency Drift:** NEVER add, modify, or drop software packages without running proper package manager updates that fully capture changes inside `package.json` and its associated lockfile.
