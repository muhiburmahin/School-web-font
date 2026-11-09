# Frontend changelog

## Platform area

### Added

- `src/app/(platform)/platform/` institutions, detail, audit, and password pages
- `src/features/platform/`
- `tests/platform.test.ts`

The area is shown only when `/auth/me` includes `platform.institutions.read`.

## Pages phase 1

### Added

- `src/features/pages/`
- `src/app/(public)/[slug]/page.tsx`
- `src/app/(admin)/admin/pages/page.tsx`
- `src/app/(admin)/admin/pages/[id]/page.tsx`
- `tests/pages.test.tsx`

### Modified

- `src/config/backend-contract.ts`
- `src/config/navigation.ts`
- `src/components/layout/site-header.tsx`
- `src/components/safe/safe-image.tsx`
- `src/app/(public)/layout.tsx`

## External links CRUD

### Added

- `src/features/external-links/mutations.ts`
- `src/features/external-links/actions.ts`
- `src/features/external-links/components/link-form.tsx`
- `src/features/external-links/components/link-manager.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/separator.tsx`
- `tests/external-link-admin.test.tsx`

### Modified

- `src/config/backend-contract.ts`
- `src/features/external-links/messages.ts`
- `src/features/external-links/types.ts`
- `src/features/external-links/schemas.ts`
- `src/features/external-links/components/changes-notice.tsx`
- `src/app/(admin)/admin/external-links/page.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `tests/external-links.test.tsx`

## Part C

### Added

- `src/components/common/fetch-notice.tsx`
- `src/features/media/api.ts`
- `src/features/media/types.ts`
- `src/features/media/schemas.ts`
- `src/features/media/messages.ts`
- `src/features/media/components/media-list.tsx`
- `src/features/media/components/media-detail.tsx`
- `src/features/media/components/changes-notice.tsx`
- `src/features/external-links/api.ts`
- `src/features/external-links/types.ts`
- `src/features/external-links/schemas.ts`
- `src/features/external-links/messages.ts`
- `src/features/external-links/components/link-list.tsx`
- `src/features/external-links/components/link-detail.tsx`
- `src/features/external-links/components/changes-notice.tsx`
- `src/app/(public)/media/page.tsx`
- `src/app/(public)/media/[id]/page.tsx`
- `src/app/(public)/external-links/page.tsx`
- `src/app/(public)/external-links/[id]/page.tsx`
- `src/app/(admin)/admin/media/page.tsx`
- `src/app/(admin)/admin/media/[id]/page.tsx`
- `src/app/(admin)/admin/external-links/page.tsx`
- `src/app/(admin)/admin/external-links/[id]/page.tsx`
- `tests/media.test.ts`
- `tests/external-links.test.tsx`

### Modified

- `src/config/navigation.ts`

## Step 2 remaining

### Added

- `src/lib/validation/text.ts`
- `src/lib/validation/url.ts`
- `src/lib/validation/color.ts`
- `src/lib/validation/identifiers.ts`
- `src/lib/validation/query.ts`
- `src/components/form/form.tsx`
- `src/components/form/form-field.tsx`
- `src/components/form/form-error.tsx`
- `src/components/form/form-submit.tsx`
- `src/components/form/apply-field-errors.ts`
- `src/components/safe/safe-link.tsx`
- `src/components/safe/safe-image.tsx`
- `tests/validation.test.ts`
- `tests/form-errors.test.ts`
- `tests/safe-render.test.tsx`
- `tests/query-params.test.ts`

### Modified

- `src/lib/safe-url.ts`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/messages.ts`
- `src/features/auth/schemas.ts`
- `src/features/institution-profile/schemas.ts`
- `src/features/institution-profile/messages.ts`
- `src/features/institution-profile/components/profile-mark.tsx`

## Connection layer

### Added

- `src/lib/api-base.ts`
- `src/lib/report-error.ts`
- `src/lib/data/result.ts`
- `src/lib/data/public.ts`
- `src/lib/data/authed.ts`
- `src/features/auth/types.ts`
- `src/features/auth/messages.ts`
- `src/features/institution-profile/schemas.ts`
- `src/features/institution-profile/messages.ts`
- `scripts/check-backend.mjs`
- `tests/data-layer.test.ts`
- `tests/feature-boundaries.test.ts`

### Modified

- `next.config.ts`
- `src/proxy.ts`
- `src/lib/api-client.ts`
- `src/lib/env.ts`
- `src/lib/env.server.ts`
- `src/lib/query-client.ts`
- `src/lib/security-headers.ts`
- `src/lib/auth/dal.ts`
- `src/config/backend-contract.ts`
- `src/features/auth/api.ts`
- `src/features/auth/schemas.ts`
- `src/features/auth/session.ts`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/require-auth.tsx`
- `src/features/institution-profile/api.ts`
- `src/features/institution-profile/types.ts`
- `src/app/(public)/page.tsx`
- `src/app/(public)/layout.tsx`
- `tests/setup.ts`
- `tests/dal.test.ts`
- `tests/env.test.ts`
- `tests/api-client.test.ts`
- `tests/institution-profile.test.ts`
- `tests/security-headers.test.ts`
- `.env.example`
- `package.json`

### Removed

- `src/features/institution-profile/hooks.ts`

## Phase 1 changelog

## Added

- `src/lib/security-headers.ts`
- `src/lib/safe-next-path.ts`
- `src/lib/auth-cookies.ts`
- `src/lib/env.server.ts`
- `src/lib/auth/dal.ts`
- `tests/security-headers.test.ts`
- `tests/safe-next-path.test.ts`
- `tests/dal.test.ts`
- `tests/server-boundary.test.ts`
- `CHANGELOG.md`

## Modified

- `next.config.ts`
- `src/proxy.ts`
- `src/app/layout.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/lib/api-client.ts`
- `src/lib/api-error.ts`
- `src/lib/env.ts`
- `src/config/backend-contract.ts`
- `src/features/auth/session.ts`
- `src/features/auth/components/require-auth.tsx`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/logout-button.tsx`
- `tests/api-client.test.ts`
- `tests/require-auth.test.tsx`
- `.env.example`
- `README.md`
- `package.json`
- `package-lock.json`
