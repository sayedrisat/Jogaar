# Authentication API

Base path: `/api/auth`. Send request bodies as `application/json`; maximum JSON body size is 16 KiB. Browser session POSTs must use the same origin as the application. Non-browser requests without an Origin header are allowed.

| Method | Path | Input / authentication | Success |
| --- | --- | --- | --- |
| POST | `/register` | `name`, `email`, `role`, `password`, `confirmPassword` | 201, user/access token and refresh cookie |
| POST | `/login` | `email`, `password` | 200, user/access token and refresh cookie |
| POST | `/refresh` | `refreshToken` cookie | 200, user/access token and replacement cookie |
| POST | `/logout` | Optional refresh cookie | 200, success message and cleared cookie |
| GET | `/me` | `Authorization: Bearer <access-token>` | 200, user |

Every user response contains `{ id, name, email, role }`. Password hashes and refresh digests are excluded. Session responses have `{ message, data: { user, accessToken } }`; `/me` has `{ message, data: { user } }`. Logout returns `{ message: "Signed out" }`.

## Validation

```json
{
  "name": "Example Developer",
  "email": "developer@example.test",
  "role": "seeker",
  "password": "development-example-only-1A!",
  "confirmPassword": "development-example-only-1A!"
}
```

Use disposable credentials rather than the example in a real account.

- Name is trimmed and must contain 2–50 characters.
- Email is trimmed and validated; existing case-sensitive email semantics are preserved.
- Role must be exactly `seeker` or `provider`, checked by both validators and the schema.
- Registration passwords need at least eight characters, uppercase, lowercase, a number and a special character. Both registration and login reject passwords longer than **72 UTF-8 bytes**, bcrypt's input boundary. Passwords are **never trimmed**. Confirmation must match exactly.

## Errors

Errors use `{ message, code }`. Validation errors additionally contain `errors: [{ path, msg }]`; rejected input values are never echoed.

| Status | Code / condition |
| --- | --- |
| 400 | `VALIDATION_ERROR`, `INVALID_JSON` |
| 401 | `INVALID_CREDENTIALS` or `UNAUTHENTICATED`; missing/invalid/expired JWT, deleted user, changed role or stale refresh cookie |
| 403 | `FORBIDDEN` for unauthorized roles; `ORIGIN_FORBIDDEN` for foreign/invalid browser origins |
| 404 | `NOT_FOUND` for unknown routes |
| 409 | `EMAIL_EXISTS`, including concurrent registration conflicts |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_ENCODING` |
| 429 | `RATE_LIMITED`; includes `Retry-After` |
| 503 | `DATABASE_UNAVAILABLE` for recognized database connection failures |
| 500 | `INTERNAL_ERROR`; generic response without exception details |

Wrong-password and unknown-email login use the same 401 message. Rejected registration/login does not issue cookies or mutate the existing session. A missing refresh cookie retains the client-compatible message `Refresh Token required`.

## Sessions and limits

Access JWTs last 15 minutes; refresh JWTs and browser cookie expiry last seven days. Both include a random `jti` and explicit purpose, issuer and audience. Only HS256 is accepted. Cookies use HttpOnly, SameSite=Lax, Path=/ and Secure in production.

One refresh digest is stored per user. Successful login replaces the previous session. Refresh atomically matches and replaces the old digest, so one concurrent request succeeds and stale/replayed requests return 401. Failed refresh requests do not clear cookies or revoke the winning session. Clients should serialize refresh requests; loaders already deduplicate them within one page. Logout invalidates only the matching refresh digest and is idempotent without a valid cookie. Existing access tokens can remain valid until their 15-minute expiry.

Per-process, per-IP limits use 15-minute windows: 20 registration attempts, 20 failed login attempts (successful logins are excluded), and a separate shared 120-request refresh/logout budget. These are baseline abuse controls, not a distributed session store.

No service-listing, booking, payment, messaging, search or profile-update endpoint exists yet.
