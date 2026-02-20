# Changelog

All significant changes to this project will be documented in this file.

This format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-02-20

### Added

- **Internship Schedule Management Enhancement**:
  - **Schedule Visibility Control**: New `isScheduleVisible` flag to control when caang users can see their rolling schedules.
  - **Internship Start Date**: Administrators can now set an official start date for the internship period.
  - **Dynamic Date Calculation**: Rolling schedules now automatically calculate and store `startDate` and `endDate` for each week based on the set internship start date.
  - **Live Countdown & Highlighting**:
    - Automatic "Minggu Ini" (Active) highlighting based on system date.
    - Real-time countdown for future weeks (e.g., "Mulai 3 hari lagi", "Mulai Besok").
    - Visual indicators for past, current, and future weeks.
  - **Integrated Date Ranges**: Date ranges are now displayed directly next to week badges in both admin and user views.

- **Internship Logbook System - Universal Support**:
  - **Multi-Type Logbook Support**: Form now supports creating logbook entries for both **Magang Divisi (Rolling)** and **Magang Departemen**.
  - **Smart Selection**: Automatically filters division/field options based on the selected internship type.
  - **Auto-Population**: For Department Internships, the system automatically fetches the user's registered field and pre-fills (and locks) the input to ensure data consistency.
  - **Enhanced Visibility**: List and detail views now show the internship type and formatted division names.

### Changed

- **Schedule Generation Logic**: Modified `generateAllRollingSchedules` to overwrite existing schedules when regenerated, ensuring date range updates propagate to all users.
- **Improved UI Aesthetics**:
  - Dynamic highlight with pulse animation for active weeks.
  - Better typography and spacing in schedule cards.
  - Consistent naming and formatting for divisions and departments.

### Fixed

- **Registration State Management**: Fixed a bug where `entryToDelete` state was missing from the logbook component, restoring the soft-delete functionality.
- **Import Errors**: Resolved missing type imports for registration schemas in the logbook component.

## [1.8.0] - 2026-02-14

### Added

- **Internship Logbook System - Major Enhancement**:
  - **Logbook Detail Modal**:
    - Beautiful detail view modal with comprehensive information display.
    - Status-specific styling with color-coded badges and icons.
    - Image gallery with lightbox functionality (click to view full size).
    - Metadata display (created at, updated at timestamps).
    - Rejection reason display for rejected logbooks.
  - **Trash System (Soft Delete)**:
    - New `/internship/trash` page for managing deleted logbooks.
    - Soft delete functionality: deleted logbooks are marked with `deletedAt` timestamp without removing files.
    - Restore capability: recover soft-deleted logbooks back to main list.
    - Permanent delete: hard delete with file removal from Firebase Storage.
    - Visual trash indicator with orange color scheme.
    - Deletion timestamp tracking.
  - **Smart File Management**:
    - Dedicated storage path: `internship/documentations/{userId}/`.
    - Automatic image compression (max 500KB) before upload.
    - Smart upload logic: only uploads new files, prevents duplicate uploads on edit.
    - Batch file deletion with `deleteStorageFiles()` helper.
    - File tracking: `deletedUrls` state to mark files for removal.

- **Service Layer Enhancements** (`internship-service.ts`):
  - `updateLogbookEntry()`: Updates existing logbook entries (fix duplicate bug).
  - `softDeleteLogbook()`: Marks logbook as deleted without removing files.
  - `hardDeleteLogbook()`: Permanently deletes logbook and all associated files.
  - `restoreLogbook()`: Restores soft-deleted logbooks.
  - `getDeletedLogbooks()`: Fetches only soft-deleted entries for trash view.
  - Enhanced `getLogbookEntries()`: Filters out soft-deleted entries automatically.

- **Storage Service** (`storage-service.ts`):
  - `uploadInternshipDocumentation()`: Dedicated upload function for logbook files.
  - `deleteStorageFiles()`: Batch deletion with error handling.
  - Proper file path structure: `internship/documentations/{userId}/{timestamp}.jpg`.

### Changed

- **Logbook Entry Management**:
  - Edit functionality now updates existing entries instead of creating duplicates.
  - Delete behavior changed from hard delete to soft delete for better data recovery.
  - File upload optimized: unchanged files are not re-uploaded during edit.
  - Confirmation dialogs updated with clearer messaging for soft delete vs permanent delete.

- **UI/UX Improvements**:
  - Logbook cards now clickable to view details.
  - Added "Sampah" (Trash) button in main logbook page header.
  - Hover effects on cards with visual feedback (shadow, border color).
  - Action buttons (Edit, Delete) use `stopPropagation` to prevent modal opening.
  - Status badges with color coding (Draft: gray, Submitted: blue, Approved: green, Rejected: red).

### Fixed

- **Critical Bug**: Duplicate logbook entries created when editing and submitting drafts.
  - Root cause: `handleAddEntry` always called `addLogbookEntry` even for edits.
  - Solution: Now uses `updateLogbookEntry` when `editingEntry` is true and entry ID exists.
  - Modal properly passes entry `id` to submit handler.

- **File Upload Issues**:
  - Wrong storage path: Files were uploaded to `registration_docs` instead of `internship/documentations`.
  - Insufficient deletion logic: Files not properly cleaned up on logbook deletion.
  - Duplicate uploads: Unchanged files were re-uploaded on every edit.

### Security

- **Firebase Storage Rules**:
  - Added rules for `internship/documentations/{userId}/` path.
  - Access control: Users can only read/write their own documentation files.
  - Admin/Recruiter override: Full access to all internship documentation.

- **Data Integrity**:
  - Soft delete prevents accidental data loss.
  - Permanent delete requires explicit confirmation with warning dialog.
  - Files remain in storage during soft delete for potential recovery.

### Schema

- **Updated `InternshipLogbookEntrySchema`**:
  - Added `deletedAt?: Date` field for soft delete tracking.
  - Maintains backward compatibility with existing entries.

### Technical Details

- **Soft Delete Flow**:
  - Sets `deletedAt` timestamp, files remain in storage.
  - Entry filtered from main list but appears in trash.
  - Can be restored (removes `deletedAt`) or permanently deleted.

- **Hard Delete Flow**:
  - Deletes all documentation files from Firebase Storage.
  - Removes Firestore document completely.
  - Irreversible action with confirmation dialog.

- **File Upload Strategy**:
  - Track new files in `uploadedFiles` state.
  - Track deleted URLs in `deletedUrls` state.
  - On submit: Delete marked files, upload new files, merge with existing URLs.
  - Prevents duplicate uploads and ensures proper cleanup.

## [1.7.0] - 2026-02-13

### Added

- **Internship Logbook System**:
  - **Complete Feature**: Creation, editing, and deletion of logbook entries (CRUD).
  - **Evidence Upload**: Image uploading with client-side compression.
  - **Security**: Firestore and Storage rules for user data protection.
  - **UX**: Deletion confirmation via `AlertDialog` and status badges.

### Fixed

- **System Stability**:
  - Configured `next.config.ts` for secure image loading (`remotePatterns`).
  - Resolved type schema mismatches (Date/Timestamp).
  - Fixed permission errors.

## [1.6.0] - 2026-02-13

### Added

- **Internship Registration System**:
  - Implemented comprehensive internship registration flow for Caang members.
  - **Rolling Division Internship**:
    - Interactive drag-and-drop form (`RollingInternshipForm`) for prioritizing role choices (Mechanic, Wiring, Programmer).
    - Validation ensuring unique role selection and distinct division choices.
    - Zod schema `RollingInternshipRegistrationSchema` for robust data validation.
  - **Department Internship**:
    - Form (`DepartmentInternshipForm`) for selecting department fields (Kestari, Metrolap, Infokom, etc.).
    - Zod schema `DepartmentInternshipRegistrationSchema` for validation.
  - **Internship Logbook**:
    - Placeholder component `InternshipLogbook` for future logbook feature.
  - **Internship Service**:
    - `internship-service.ts` to handle Firestore operations (submit, get status) for both registration types.
    - Firestore Security Rules updated to secure `internship_rolling_registrations` and `internship_department_registrations` collections.

### Security

- **Firestore Rules**:
  - Added specific rules for `internship_rolling_registrations` and `internship_department_registrations`.
  - Enforced `isOwner` check for create/read/update operations, ensuring users can only access their own data.
  - Restricted delete operations to Admins/Recruiters only.

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
