# Changelog

All significant changes to this project will be documented in this file.

This format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
