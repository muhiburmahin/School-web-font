# Institution website frontend

Foundation for the public site and the administrator shell. Feature modules such as notices, media, pages, and external links are not implemented.

## Setup

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

The app listens on port **3000**. The API is assumed at `http://localhost:5000` until `NEXT_PUBLIC_API_BASE_URL` says otherwise.

## Environment

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | API origin, no path. Required in production. Development and tests fall back to `http://localhost:5000`. |
| `SESSION_COOKIE_NAME` | Must match the backend session cookie. Default `sid`. HttpOnly. Not read by page JavaScript. |
| `NEXT_PUBLIC_CSRF_COOKIE_NAME` | Must match the readable CSRF cookie. Default `csrf`. |
| `NEXT_PUBLIC_CSRF_HEADER` | Must match the CSRF header. Default `x-csrf-token`. |
| `NEXT_PUBLIC_API_MOCKS` | `true` enables the dev mock. Production ignores this flag. |

No secret belongs in `NEXT_PUBLIC_*` or in this repository. Do not commit `.env.local`.

## Folder architecture

`app/` holds routes and layouts only. `features/` owns one module each. Features do not import another feature's files. `lib/api-client.ts` is the only fetch wrapper. `components/ui` is presentational. Shared chrome lives in `components/layout` and `components/common`.

Next.js 16 runs the admin cookie check from `src/proxy.ts`. The old `middleware.ts` filename is deprecated in this version. The admin layout still calls `GET /api/v1/auth/me`. A cookie by itself is not treated as a session.

## Backend connection

1. Run the API on port 5000.
2. Keep `http://localhost:3000` in backend `FRONTEND_ORIGINS`. When that variable is unset outside production, the allowlist includes `http://localhost:3000`.
3. Keep `SESSION_COOKIE_NAME` and `CSRF_COOKIE_NAME` aligned with this app.
4. Do not send `institutionId`, `tenantId`, `x-institution-id`, or `x-tenant-id`. The API chooses the institution from the `Host` of the API request.
5. A server render calls the API with the API host, not the browser host. In dedicated mode the profile endpoint currently returns 404, and the page shows the fallback instead of crashing.
6. Login is `POST /api/v1/auth/login` with `{ email, password }` and does not need a CSRF token. Logout is `POST /api/v1/auth/logout` and sends `x-csrf-token` when the `csrf` cookie is present. `GET /api/v1/auth/me` returns `id`, `email`, `displayName`, `roles`, and `permissions`.
7. CORS must allow the frontend origin with credentials, and must allow headers `Content-Type`, `Accept`, `x-request-id`, and `x-csrf-token`.

The public profile fields are `nameEn`, `nameBn`, `level`, `establishedYear`, `addressEn`, `addressBn`, `officialEmail`, `officialPhone`, `district`, `upazila`, `logoUrl`, and `faviconUrl`. There is no theme field. The theme stays the neutral shadcn palette. Logo and favicon URLs are rendered only for `http` and `https` URLs without userinfo.

## Assumptions to confirm

From `src/config/backend-contract.ts`:

- A browser on `http://localhost:3000` can store the session cookie set by `http://localhost:5000`, and `FRONTEND_ORIGINS` includes `http://localhost:3000`.
- Institution logo hosts are not declared by the API. `MEDIA_IMAGE_ORIGINS` stays empty until those hosts are known. The client honors `Retry-After` on HTTP 429 when a response includes it. `wen-backend/src` does not set that header itself.

This was not verified against a running API.

## Mocks

Set `NEXT_PUBLIC_API_MOCKS=true` in `.env.local` and restart `npm run dev`. The fixtures in `src/mocks/dev-fixtures.ts` answer the profile, login, logout, and current-user calls. They are labeled mock data. Production builds ignore the flag. Turn the flag back to `false` before connecting the real API.

## How to add a feature

Use institution profile as the pattern.

1. Add `features/<name>/types.ts` with only fields the backend returns.
2. Add `features/<name>/api.ts` that calls `apiFetch` with a path from `backend-contract.ts`.
3. Add `features/<name>/hooks.ts` when a client component needs React Query.
4. Add `features/<name>/components/` for that feature's UI.
5. Add a route under `app/` that renders those components and contains no fetch logic of its own.
6. Do not import another feature's files. Do not add a second HTTP client.

## Tests

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Before production

- Confirm the cookie assumption above against the running API.
- Set `NEXT_PUBLIC_API_BASE_URL` to the real API origin and keep mocks off.
- Add this site's origin to `FRONTEND_ORIGINS`.
- Dedicated institution resolution still has to be wired on the backend before the public profile can load in that mode.
- The permission list from `GET /api/v1/auth/me` is empty until a permission matrix exists. This UI does not invent permissions.
- Notices, media, pages, and external links are not built here.

## Security headers

The proxy sets these on HTML responses. `CSP_REPORT_ONLY=true` sends the policy as `Content-Security-Policy-Report-Only` so a browser reports violations without blocking. `MEDIA_IMAGE_ORIGINS` is a comma-separated list of absolute image origins. Leave it empty until the logo host is known. There is no wildcard host.

| Header | Value | Trade-off |
| --- | --- | --- |
| Content-Security-Policy | Per-request nonce, `script-src` nonce + `strict-dynamic`, `object-src 'none'`, `frame-ancestors 'none'`, `connect-src` self + API origin, `img-src` self + `data:` + listed media origins | Blocks injected scripts. `style-src` allows inline styles because a style nonce would break React style attributes. Dev adds `unsafe-eval` and the local HMR websocket. Nonces require dynamic rendering, so cache components are off. |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` in production only | Forces HTTPS after the first visit. It is omitted on local HTTP. |
| X-Content-Type-Options | `nosniff` | Stops MIME sniffing. |
| Referrer-Policy | `strict-origin-when-cross-origin` | Cross-origin requests send the origin, not the path. |
| Permissions-Policy | Camera, microphone, geolocation, payment, USB, and motion sensors disabled | This site does not use those features. A later feature that needs one must change this header. |
| X-Frame-Options | `DENY` | Pages cannot be framed. |
| Cross-Origin-Opener-Policy | `same-origin` | Isolates the browsing context from cross-origin windows. |
| Cross-Origin-Resource-Policy | `same-origin` | Other sites cannot embed these responses as resources. |

`X-Powered-By` is disabled. These headers reduce what a browser will do with a compromised response. They do not replace backend authentication, CSRF, or authorization.
