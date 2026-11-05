# Implementation status

Reviewed on **5 November 2026**. Authentication regression results below were executed locally; this remains an unfinished marketplace.

## Implemented and covered

- [x] Registration/login with bcrypt, strict role/input validation and concurrent duplicate-email handling.
- [x] Shared JSON error handling, missing-user checks and normalized JWT errors.
- [x] Explicit HttpOnly/SameSite/production Secure cookie policy and matching logout attributes.
- [x] Hashed refresh storage, unique JWT IDs and atomic refresh rotation/replay rejection.
- [x] Bearer authentication, current-role checks and reusable server role authorization.
- [x] Same-origin checks, bounded JSON parsing and separate auth/session rate limits.
- [x] Database/index readiness before listening; startup failures exit nonzero.
- [x] Client 401-to-refresh recovery, shared pending checks and safe logout state.
- [x] Sign-in/join dialogs, role navigation, landing page and themes.
- [x] Server, client unit and real-browser authentication regressions; GitHub Actions workflow.

## Verification

| Check | Result |
| --- | --- |
| Server `npm test` | **36 passed**, including real-MongoDB integration, replay/concurrency, malformed requests, limits and database startup failure |
| Client `npm run test:unit` | **11 passed**, covering session state, 401 recovery, server-error propagation and deduplication |
| Client `npm run test:e2e` | **4 Chromium tests passed** against the built client and real API |
| Client `npm run lint` | **Passed**, including the previous four unused-import errors |
| Client production build | **Passed** as part of browser setup; Vite retains its existing large-chunk warning |
| `npm audit --omit=dev` in both packages | **Zero known production dependency advisories** |

Browser coverage: seeker and provider registration, cookie-backed reload, role-route redirection, logout/cookie removal, protected-route rejection, wrong-password feedback followed by valid login, and expired access JWT recovery through the real refresh API. The expiry test substitutes a signed expired Authorization header on one `/me` request; server responses and refresh persistence remain real.

Tests generate disposable database names and synthetic secrets, then remove those databases. They do not read the developer's backend `.env`. This is local automated evidence, not a penetration test, production acceptance or cross-device verification. The checked-in workflow runs the same checks on push and pull requests; its current result is visible under GitHub Actions.

## Remaining

- [ ] Service listings, provider service management and seeker discovery.
- [ ] Booking lifecycle, messaging and payments.
- [ ] Editable profiles and functional provider dashboard tools.
- [ ] Account recovery and email verification.
- [ ] Independent device sessions, shared rate-limit storage and deployment-specific proxy/IP configuration.
- [ ] Production hosting/HTTPS acceptance and repository-wide licensing.

`Dashboard.jsx` reserves space for future tools; `Profile.jsx` currently renders a label. Future role-specific APIs must add resource authorization and ownership checks. See [security notes](SECURITY-NOTES.md) for session/deployment limits.
