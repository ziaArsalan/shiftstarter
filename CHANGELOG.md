# Changelog

User-facing changes only. Technical detail lives in `plans/` and `docs/`.

## 2026-11-17

### Added
- Account sign-up, sign-in, sign-out and password reset (Milestone 2 — Core Platform & Multi-Tenant Roles).
- Worker accounts for four professional roles: pharmacist, pharmacy technician, pharmacy assistant and pharmacy student, with a worker profile (experience, location, rate).
- Pharmacy organizations with owner and manager roles, member invites, and multiple pharmacy locations per organization.
- Credential (licence) upload for workers, with admin review and approve/reject notes visible to the worker.
- Super-admin portal: user and organization lists, credential approval queue, and a pharmacy chain catalog with logos.
- Pharmacy chain selection for organizations, with the chain logo shown on the organization profile.
- Responsive web layout for phones, tablets and desktops.

### Changed
- Each account is either a pharmacy professional or a pharmacy owner/manager, not both.
- Strict separation between pharmacies: each organization can only see and change its own data.

### Fixed
- Session errors no longer send signed-in users back to onboarding; an error screen with retry is shown instead.
- Website links only accept http and https addresses.
- Rejecting a credential requires a note, and the reason is shown to the reviewer.
- Deleting a location asks for confirmation first.
- Sign-up details carry through email confirmation, and signed-in users are redirected away from the login and sign-up pages.
- The organization member count and worker profile summary display correctly.

### Known limitations
- Pharmacy sign-up through the form and password-reset email delivery were not tested end to end because the authentication provider's email rate limit was reached.

## 2026-11-11

### Added
- Project foundation: architecture, PostgreSQL data model, API design, role/permission model, and UI/flow planning for the Pharmacy Staffing Marketplace (Milestone 1 — Planning & Architecture).
- Empty application scaffold (`client/` web app and `server/` API) with tooling, ready for feature development.
- Claude Code milestone workflow (agents, `/start` command, docs) for running the project milestone by milestone.
