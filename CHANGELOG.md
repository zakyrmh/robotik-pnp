# Changelog

All significant changes to this project will be documented in this file.

This format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-02-10

### Added

- **Logbook Detail View**:
  - New modal component (`LogbookDetailModal`) to view full details of a logbook entry.
  - Displays title, status badges, category, date, duration, author, description, achievements, challenges, and next plan.
  - Shows creation and update timestamps.
  - Accessible by clicking on a logbook card.

- **Logbook Edit Feature**:
  - New modal form (`LogbookEditModal`) to edit existing logbook entries.
  - Pre-fills form with existing data.
  - Allows editing all fields: title, date, category, duration, description, achievements, challenges, next plan.
  - Supports saving as "Draft" or "Submitted" for review.
  - Only allows editing if the logbook status is "Draft".
  - Refreshes logbook list and statistics automatically after update.

### Technical Details

- Added `LogbookDetailSheet` and `LogbookEditModal` components.
- Integrated detail and edit flow in `ResearchLogbookPage`.
- Added `ScrollArea` and `Sheet` UI components from Shadcn UI.
- Implemented state management for viewing and editing logbooks.
- Refactored `fetchData` with `useCallback` for better hook dependency management.

## [1.8.0] - 2026-02-10

### Added

- **Team Members List in Research Logbook**:
  - New card component displaying list of fellow team members in the same division.
  - Shows member information: name, photo, management position (ketua tim, wakil, sekretaris, bendahara, anggota), and technical role (elektrikal, mekanikal, programmer).
  - Members are automatically filtered based on the user's active KRI team assignment.
  - Sorted by management position hierarchy (chairman first, vice chairman second, etc.).
  - Visual indicators with color-coded badges for positions and roles.
  - Avatar display with fallback initials.
  - Loading skeleton animation for better UX.
  - Responsive design matching existing Research Logbook page aesthetics.

### Technical Details

- Created `lib/firebase/services/team-member-service.ts` with functions:
  - `getTeamMembers()`: Fetches team members from Firestore with automatic filtering and sorting.
  - Helper functions for labels and badge colors for positions and roles.
- Created `app/(private)/research-logbook/_components/team-members-card.tsx`: Reusable card component with loading states.
- Integrated into Research Logbook page below stats cards.
- Query optimization: Single Firestore query with client-side filtering for team assignment.

## [1.7.0] - 2026-02-03

### Added

- **Research Logbook Form Modal**:
  - New modal popup form for creating research logbook entries.
  - Form fields based on `schemas/research-logbook.ts` schema:
    - Judul Kegiatan (required)
    - Tanggal Kegiatan with date picker (required)
    - Kategori Aktivitas dropdown (required)
    - Durasi Kegiatan in hours (optional)
    - Deskripsi Kegiatan (required)
    - Hasil yang Dicapai (optional)
    - Kendala yang Dihadapi (optional)
    - Rencana Selanjutnya (optional)
  - Two submission modes:
    - "Simpan Draft": Save as draft for later editing
    - "Ajukan Review": Submit for supervisor review
  - Form validation using Zod schema and React Hook Form.
  - Auto-refresh logbook list and statistics after successful creation.
  - Responsive modal design for mobile and desktop.

### Technical Details

- Created `app/(private)/research-logbook/_components/logbook-form-modal.tsx`.
- Integrated with `createLogbook()` service from `logbook-service.ts`.
- Uses existing UI components: Dialog, Form, Select, Calendar, Input, Textarea.
- Author information (ID and name) automatically populated from user context.
- Team information automatically populated from user's active KRI team assignment.

## [1.6.0] - 2026-02-02

### Added

- **Research Logbook Feature (`/research-logbook`)**:
  - New page for KRI team members to document research and development activities.
  - Team-based access control: Users can only view logbooks from their assigned KRI team (KRAI, KRSBI-H, KRSBI-B, KRSTI, KRSRI).
  - Access restricted to users with `isKRIMember` role.
  - Statistics dashboard showing total entries, total hours, pending reviews, and approved entries.
  - Activity categories: Design, Fabrication, Assembly, Programming, Testing, Debugging, Documentation, Meeting, Training, Competition Prep, Other.
  - Status tracking: Draft, Submitted (awaiting review), Needs Revision, Approved.
  - Filter and search functionality by status, category, and keyword.
  - Created `schemas/research-logbook.ts` with Zod schemas for logbook data validation.
  - Created `lib/firebase/services/logbook-service.ts` for Firestore operations.
  - Helper functions for displaying human-readable labels and badge colors.

- **Sidebar Navigation Update**:
  - Added new menu group "Riset & Pengembangan" (Research & Development).
  - Added "Logbook Riset" menu item for KRI team members.
  - Menu is visible to users with `isKRIMember` or `isSuperAdmin` roles.

### Technical Details

- Collection: `research_logbooks` in Firestore.
- Supports soft delete with `deletedAt` and `deletedBy` fields.
- Activity date-based ordering (most recent first).
- Client-side filtering for flexible search without requiring composite indexes.

## [1.5.3] - 2026-01-30

### Added

- **Contact Person & WhatsApp Group Link in Caang Dashboard**:
  - Added "Kontak Panitia" section displaying contact persons with clickable WhatsApp links.
  - Added "Grup WhatsApp" section with prominent join button linking to `externalLinks.groupChatUrl`.
  - Added `formatWhatsAppLink()` helper to convert local phone numbers (e.g., 08xx) to wa.me links.
  - Fetches data dynamically from `recruitment_settings` in Firestore.
  - Displays fallback messages when contact persons or group link are not available.

- **Learning Page (`/learning`) for Caang Users**:
  - New page at `/learning` to display materials and tasks for prospective members.
  - **Materials Tab**: Displays learning materials (file, link, article) with type badges and view counts.
  - **Tasks Tab**: Displays published tasks separated by active/completed status.
  - Deadline indicators: "Segera Berakhir" (within 48 hours) and "Berakhir" (past deadline).
  - Search functionality across materials and tasks.
  - Material type filter (file, link, article).
  - Logs material access (view/download) for analytics.
  - Responsive grid layout with hover effects and clickable cards.

- **Presence Page (`/presence`) for Caang Users**:
  - New page at `/presence` to display attendance history for prospective members.
  - **Stats Cards**: Summary of attendance counts (Hadir, Terlambat, Sakit, Izin, Alfa) with percentages.
  - **Visual Chart**: Stacked progress bar showing attendance distribution with legend.
  - **Attendance Rate**: Overall attendance percentage (Hadir + Terlambat).
  - **Activity Cards**: Collapsible cards showing activity details and attendance status.
  - Upcoming vs Past activities separation.
  - Automatically marks as "Alfa" if no attendance record exists for completed activities.
  - Fetches activities from `activities` collection and attendances from `attendances` collection.

### Fixed

- **"Diajukan pada: Invalid Date" Bug**:
  - Fixed date formatting issue in `step-verification.tsx` where Firebase Timestamp was not properly converted to Date.
  - Added `formatSubmittedDate()` helper function to safely handle Firebase Timestamp, Date object, or string values.
  - Uses TypeScript-safe type checking with `"toDate" in value` pattern.

- **Avatar 404 Error**:
  - Fixed broken avatar image fallback that referenced non-existent `/images/avatar.jpg`.
  - Updated `FirebaseImage.tsx` to show a default User icon (from lucide-react) when no photo is available.
  - Added `showIconFallback` prop (default: `true`) for customizable fallback behavior.
  - Added `onError` handler to catch image loading failures and display icon fallback.
  - Removed hardcoded `/images/avatar.jpg` fallback from `user-info.tsx`, `caang-table.tsx`, and `biodata-tab.tsx`.

### Removed

- **Removed "Aktivitas Terbaru" Section from Caang Overview**:
  - Removed the "Aktivitas Terbaru" (Recent Activities) section from `overview-card.tsx` for caang users.
  - This section was not useful as caang users are directed step-by-step through the registration form.
  - Cleaned up related unused code: `DerivedActivity` type, `deriveActivitiesFromRegistration()`, `formatRelativeTime()`, and `derivedActivities` state.

## [1.5.2] - 2026-01-29

### Changed

- **Dynamic Recruitment Period Data**:
  - `RegistrationFormContext` now fetches `activePeriod` and `activeYear` from global `recruitment_settings` in Firestore instead of using hardcoded values.
  - Added `activeYear` field to `RecruitmentSettingsSchema` and `RecruitmentSettingsFormSchema`.
  - Added `instagramRobotikUrl`, `instagramMrcUrl`, and `youtubeRobotikUrl` to `ExternalLinksSchema` for managing social media links.
  - Updated `settings-service.ts` to support saving and retrieving `activeYear` and new social media links.
  - Updated `step-documents.tsx` to fetch social media links from global `recruitment_settings` in Firestore instead of using hardcoded values.
  - Implemented client-side image compression (< 300KB, .jpeg) for document and payment proof uploads to optimize storage and bandwidth.
  - Integrated Firebase Storage with structured paths (`users/{uid}` and `registration_docs/{period}/{uid}`) and automatic old file deletion upon replacement.
  - Added visual upload progress dialog (compression & upload status) for better user feedback.
  - Fixed synchronization issue where user photo and KTM URLs were not saving to the user profile (`users_new`) during document upload.
  - Refactored payment step to use dynamic settings (multiple banks/e-wallets) from Recruitment Settings instead of hardcoded values.

## [1.5.1] - 2026-01-29

### Fixed

- **Critical Security Fix in Registration Flow**:
  - Replaced unsafe server-side email verification link generation with secure Custom Token flow.
  - Mitigated risk of account hijacking via leaked verification links.
  - Server now returns a time-limited `customToken` which the client uses to sign in securely.
  - Client-side (`register-form.tsx`) updated to handle `signInWithCustomToken` and trigger `sendEmailVerification` via official SDK.
  - Cloud Function (`functions/src/auth/register.ts`) updated to generate and return `customToken` instead of raw link.
  - Resolved `iam.serviceAccounts.signBlob` permission error by guiding IAM role assignment.

## [1.5.0] - 2026-01-28

### Added

- **Secure Login System (Cloud Functions)**:
  - Cloud Function `loginUser` with comprehensive security features.
  - Rate Limiting: 5 attempts per 15 minutes, 1-hour block on exceed.
  - Email Verification Check: Blocks login if email not verified (with UI hint).
  - Account Status Check: Blocks disabled/inactive/blacklisted accounts.
  - Audit Logging: Login history stored in `login_history` collection (30-day retention).
  - Session Tracking: Sessions stored in `login_sessions` with 24-hour expiry.
  - Online Presence: Automatic online status in Realtime Database.

- **Force Re-Authentication**:
  - `useReAuth` hook for sensitive actions requiring password confirmation.
  - `ReAuthDialog` component for re-authentication modal.
  - Session expiry after 24 hours requiring re-login.

- **New Schemas**:
  - `schemas/login-history.ts` for login audit and session tracking.

### Changed

- Updated `login-form.tsx` to use Cloud Function instead of direct Firebase Auth.
- Login now uses Custom Token flow for enhanced security.
- Device info captured and logged for security audit.

### Security

- Pre-login checks prevent unauthorized access before authentication.
- Audit logging enables security monitoring and incident investigation.
- Session tracking enables force logout and re-authentication.
- Rate limiting prevents brute-force attacks on login endpoint.

### Technical Details

- Login Cloud Function region: `asia-southeast2` (Jakarta).
- Session expiry: 24 hours (configurable).
- Login history retention: 30 days.
- Collections added: `login_history`, `login_sessions`, `login_rate_limits`.

## [1.4.0] - 2026-01-27

### Added

- **Cloud Functions for Registration (Atomic & Secure)**:
  - New `functions/` directory for Firebase Cloud Functions.
  - Cloud Function `registerUser` that handles:
    - Server-side data validation using Zod schema.
    - Firebase Authentication account creation.
    - Default role assignment (`isCaang: true`).
    - Firestore database storage in `users_new` collection.
    - Automatic rollback if any step fails.
  - Client service `cloud-functions.ts` using `httpsCallable` for secure function invocation.

- **Rate Limiting (Anti-Spam Protection)**:
  - Maximum 5 registration attempts per IP address within 15 minutes.
  - Automatic 1-hour block when limit is exceeded.
  - Rate limit data stored in Firestore `rate_limits` collection.
  - Rate limit cleared after successful registration.

### Changed

- Migrated registration logic from client-side (`lib/firebase/services/auth.ts`) to server-side (Cloud Functions).
- Updated `register-form.tsx` to call Cloud Function instead of direct Firebase Auth SDK.

### Security

- Sensitive operations (account creation, role assignment, database writes) now run entirely on server.
- Reduced attack surface by removing direct Firebase Auth SDK calls from client.
- Implemented atomic transaction pattern: all operations succeed or all are rolled back.
- **Rate Limiting**: Prevents brute-force and spam attacks on registration endpoint.

### Technical Details

- Cloud Functions region: `asia-southeast2` (Jakarta).
- Functions SDK: `firebase-functions` v6.3.0 with `firebase-admin` v13.0.0.
- Compatible with Firebase SDK v12 and Next.js 16.
- Rate limit config: 5 attempts / 15 min window / 1 hour block.

## [1.3.0] - 2026-01-25

### Added

- Multi-step registration form for caang with stepper UI (responsive for mobile, tablet, desktop).
- Step 1: Personal data form with full name display (read-only), date picker, and profile pre-fill.
- Step 2: Documents upload form with preview (photo, KTM, social media proof).
- Step 3: Payment form with method selection (transfer, e-wallet, cash) and proof upload.
- Step 4: Verification summary with confirmation dialog and status display.
- `RegistrationFormContext` for state management across registration steps.
- Dynamic jurusan & prodi dropdown from Firestore `jurusan-prodi` collection.
- `jurusan-prodi-service.ts` for fetching department and study program data.
- New UI components: `Form`, `Alert`, `Checkbox`, `RadioGroup`.

### Fixed

- Unused import warnings in registration form components.
- useEffect dependency warning in registration form context.

## [1.2.0] - 2026-01-13

### Added

- OR settings page and system.

### Fixed

- Dashboard for caang.

## [1.1.0] - 2026-01-09

### Added

- Settings page for editing personal data.

## [1.0.0] - 2026-01-08

### Added

- Management of prospective members for open recruitment.
- Management of prospective member activities for open recruitment.
- Management of prospective member attendance for open recruitment.
- Management of learning materials for prospective members for open recruitment.
- Management of tasks and scores for prospective members for open recruitment.
- System for dividing prospective members into groups for open recruitment.
