# Architecture and authentication flow

Jogaar has two separately installed packages: `real-client/` and `server/`. There is no service-listing model, payment integration or background worker.

## Frontend

`main.jsx` mounts React with Redux and React Router. Guest routes are `/`, `/login` and `/join`; seeker routes are `/seeker` and `/seeker/profile`; provider routes are `/provider/dashboard` and `/provider/profile`.

`authAction.js` sends relative `/api/auth/*` requests. Redux keeps access tokens in memory. Auth success stores user/token; rejection clears the session. Logout success clears the session with a null error, avoiding rendering a response object as a React child.

`ensureSession()` deduplicates overlapping loader checks. With an access token it calls `/me`; a 401 falls back to refresh. A network/server failure from `/me` propagates without erasing the current session. With no access token it refreshes immediately. `requireRole()` and `guestOnlyLoader()` use the result for navigation. These controls supplement API authorization.

## Backend

`server.js` awaits MongoDB connection and user-index initialization before listening on configured `PORT`. Startup database failures exit nonzero. `createApp()` disables the Express signature header, parses bounded JSON/cookies, mounts the auth router and ends with JSON 404/error handlers. Express 5 forwards async controller errors to that shared handler.

POST routes apply same-origin checks and independent request limits before validation. Validators reject invalid types/roles and do not reflect input values. `authenticate` verifies the bearer JWT and loads the current user. `authorize(...roles)` enforces the current database role; `/me` permits either supported role. Future marketplace endpoints must choose narrower roles and check resource ownership.

The Mongoose model keeps name, unique email, bcrypt password hash, role and one refresh digest. `passwordHash` and `refreshToken` are hidden from default queries. The existing `refreshToken` field name is retained, but **its value is now a SHA-256 digest**, not a JWT. The unique email index handles concurrent account-creation races; duplicate errors become 409.

## Session lifecycle

1. Registration hashes the password with bcrypt cost 12, prepares tokens and saves the user plus refresh digest once. Cookies are issued after persistence succeeds.
2. Login verifies credentials, rejects unsupported legacy roles and replaces the refresh digest. Registration/login return a public user and access token, plus an HttpOnly refresh cookie.
3. The browser stores the access token in Redux. The Axios interceptor attaches it to authenticated requests.
4. `/me` verifies signature, HS256, expiry, issuer, audience, purpose and claim shape; it rejects deleted users or roles changed since issuance.
5. Refresh verifies the cookie JWT and atomically compares/replaces the digest using user ID and role. Random JWT IDs prevent identical tokens within one second. Only one parallel refresh can win; a losing/stale request neither clears cookies nor revokes the new session.
6. Logout sets the matching refresh digest to null and clears the cookie using the same Path/SameSite/Secure policy. Repeated logout is safe. Access JWTs expire independently within 15 minutes.

This is one active refresh session per user. Cross-tab coordination, independent device sessions and token-family revocation are not implemented. Legacy refresh sessions require a fresh login after upgrade.

## Deployment and verification

Vite development **and preview** proxy `/api` to `JOGAAR_API_TARGET` (default localhost:3000). Production requires a separate same-origin HTTPS reverse proxy, matching `PUBLIC_ORIGIN`, SPA fallback and reviewed database access. Secure cookies are enabled through `NODE_ENV=production`; production configuration rejects absent/non-HTTPS public origins and weak/identical signing secrets.

Limits currently use an in-memory per-process store. Reverse-proxy client-IP trust must be configured for the actual hosting topology before deployment; the application does not blindly trust forwarded IP headers.

Server regressions use real HTTP and isolated MongoDB databases. Client unit tests check Redux/session behavior. Playwright builds the client and starts the API/proxy with generated secrets, then exercises actual browser authentication. GitHub Actions provisions MongoDB and Chromium for the same checks. No live production deployment has been accepted.
