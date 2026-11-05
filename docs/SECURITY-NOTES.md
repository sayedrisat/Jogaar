# Security limitations — development snapshot

This document records observed implementation gaps so an unfinished prototype is not presented as production-ready.

- Registration/login/refresh controllers have rejection paths without early returns; some controllers also assume a database user exists.
- The role validator accepts any string and the schema does not declare an enum. There are client route guards and access-token authentication, but no server role-authorization middleware.
- Refresh JWTs are stored directly on the user record. The system does not implement hashed token storage, per-device sessions, token families or fully verified replay detection.
- Refresh cookies currently set only `httpOnly`; explicit `secure`/`sameSite` policy and browser expiry are not configured.
- Invalid/expired access JWT errors are not normalized by the authentication middleware. There is no centralized error handler or request-rate limit.
- Database startup errors are logged and swallowed, so a listening server is not proof that MongoDB connected.

Fix and test these cases before deploying the API for real accounts. These notes describe source inspection; they are not a completed penetration test.

## Secrets and publication

The root `.gitignore` excludes `.env`, nested `.env.*` files, private-key file extensions, dependencies and build output while permitting `.env.example`. The backend example contains placeholders and a local database URI only. Never paste real JWTs, database credentials, cookies or personal user records into issues or documentation.

If a real credential is discovered in published files or history, rotate it at its provider before removing the exposed copy. Deleting a file does not revoke a credential. No Git history rewrite is part of this task.

## Dependency review

The backend lockfile resolves `body-parser` 2.4.0, which patches [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828). Production dependency audits for both packages reported zero known advisories on 5 November 2026. This registry result does not cover the application-level limitations listed above.
