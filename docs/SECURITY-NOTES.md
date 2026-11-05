# Authentication security notes

The November 2026 auth update fixes the observed rejection-path, role-validation, token-storage, cookie, JWT-error and database-startup gaps. Automated negative-path and real-browser checks are recorded in [status](STATUS.md). This is not a penetration test or production certification.

## Implemented controls

- Strict `seeker`/`provider` validators and schema enum; authenticated user/role checks and reusable authorization middleware.
- Early rejection through shared HTTP errors, 409 for duplicate emails and generic 500 responses without stacks, credentials or rejected field values.
- JWT signature/algorithm, issuer, audience, expiry, purpose and claim checks; random token IDs.
- SHA-256 refresh digests hidden by default, atomic single-use rotation and stale-token rejection without destroying a newer session.
- HttpOnly, host-only, SameSite=Lax cookies, explicit expiry and matching clear attributes; Secure in production.
- Per-IP registration/login/session throttling, 16-KiB JSON bodies and same-origin browser session POSTs.
- Fail-fast secret/origin configuration and database/index readiness before serving requests.
- Registration passwords are not trimmed; the 72-byte UTF-8 limit avoids bcrypt silently truncating new passwords.

## Remaining boundaries

- **One active refresh session per user.** A new login invalidates the previous refresh token. There are no per-device sessions or token families. Parallel refresh has one winner; loaders deduplicate within one page, but separate tabs need client coordination.
- **Logout revokes refresh, not already issued access JWTs.** Those can remain valid until their 15-minute expiry. Deleted users and changed roles are checked on `/me`.
- **Legacy sessions need login again.** Older cookies/claims and plaintext stored refresh values are rejected. Successful login overwrites the existing field with a digest; no live database migration is performed.
- **Rate limits are in-memory and reset on restart.** Multiple instances require a shared store. Review trusted proxy addresses and real client-IP propagation before hosting; do not enable unrestricted `trust proxy`.
- **Production hosting is unverified.** Use HTTPS, set `NODE_ENV=production` and an exact HTTPS `PUBLIC_ORIGIN`, serve frontend/API through one origin, configure SPA fallback and restrict database access. The origin policy permits non-browser clients that omit Origin; it is not an authentication mechanism.
- **MongoDB requires a compatible host kernel.** Review the vendor's [production notes](https://www.mongodb.com/docs/manual/administration/production-notes/) when choosing a host. CI pins Ubuntu 22.04 after MongoDB 8.0 refused to start on the default runner due to [SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912).
- **Future marketplace authorization remains necessary.** Client guards and the `/me` role allowlist do not grant ownership protection to endpoints that have not been built.
- Account recovery, email verification, a full production logging/monitoring policy and deployment acceptance remain future work.

## Secrets and testing

`.gitignore` excludes environment files, key files, dependencies, generated builds and test reports while allowing `.env.example`. Never publish real JWTs, database credentials, cookies or customer records. Rotate any accidentally exposed credential at its provider; removing a file does not revoke it.

Tests generate secrets and uniquely named databases on a disposable MongoDB instance. They never load the developer's `.env`; cleanup is restricted to their test database prefixes. `TEST_MONGO_URI` must point only at testing infrastructure.

Production dependency audits for both packages reported zero known advisories on 5 November 2026. Registry audit results do not assess application-level security or unimplemented features.
