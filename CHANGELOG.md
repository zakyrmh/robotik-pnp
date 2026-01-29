# Changelog

All significant changes to this project will be documented in this file.

This format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Registration Verification & Rejection in Caang Management**:
  - Added "Verifikasi" and "Reject" buttons in caang detail modal footer when registration status is `submitted`.
  - Verification confirmation modal with caang info preview before approving.
  - Rejection modal with 3 action options:
    - **Minta Revisi**: Return to `in_progress` status, allowing caang to edit and resubmit.
    - **Tolak Permanen**: Set status to `rejected` with no further editing allowed.
    - **Batal**: Cancel the action.
  - Added `verifyRegistration()`, `rejectRegistration()`, and `requestRevision()` service functions in `caang-service.ts`.
  - Rejection reason is stored in `verification.rejectionReason` field.

### Fixed

- **Logout Not Redirecting Issue**:
  - Fixed logout function not redirecting to login page without manual browser refresh.
  - Reordered logout execution: state reset → cookie removal → Firebase sign out → redirect.
  - Changed `router.push()` to `router.replace()` to prevent back navigation to protected routes.
  - Ensured `router.refresh()` is called after redirect for proper server state update.

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

- **Secure Login System (Cloud Functions)**
  - Cloud Function `loginUser` with comprehensive security features.
  - Rate Limiting: 5 attempts per 15 minutes, 1-hour block on exceed.
  - Email Verification Check: Blocks login if email not verified (with UI hint).
  - Account Status Check: Blocks disabled/inactive/blacklisted accounts.
  - Audit Logging: Login history stored in `login_history` collection (30-day retention).
  - Session Tracking: Sessions stored in `login_sessions` with 24-hour expiry.
  - Online Presence: Automatic online status in Realtime Database.

- **Force Re-Authentication**
  - `useReAuth` hook for sensitive actions requiring password confirmation.
  - `ReAuthDialog` component for re-authentication modal.
  - Session expiry after 24 hours requiring re-login.

- **New Schemas**
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

- **Cloud Functions for Registration (Atomic & Secure)**
  - New `functions/` directory for Firebase Cloud Functions.
  - Cloud Function `registerUser` that handles:
    - Server-side data validation using Zod schema.
    - Firebase Authentication account creation.
    - Default role assignment (`isCaang: true`).
    - Firestore database storage in `users_new` collection.
    - Automatic rollback if any step fails.
  - Client service `cloud-functions.ts` using `httpsCallable` for secure function invocation.

- **Rate Limiting (Anti-Spam Protection)**
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

## [1.0.0] - 2026-01-08

### Added

- Management of prospective members for open recruitment.
- Management of prospective member activities for open recruitment.
- Management of prospective member attendance for open recruitment.
- Management of learning materials for prospective members for open recruitment.
- Management of tasks and scores for prospective members for open recruitment.
- Management of prospective member attendance for open recruitment.
- System for dividing prospective members into groups for open recruitment.

## [1.1.0] - 2026-01-09

### Added

- Settings page for editing personal data.

## [1.2.0] - 2026-01-13

### Added

- OR settings page and system.

### Fixed

- Dashboard for caang.

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
