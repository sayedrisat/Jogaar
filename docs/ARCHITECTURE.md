# Architecture and authentication flow

Jogaar currently has two independently installed packages, `real-client/` and `server/`. There is no shared TypeScript package, background worker, payment integration, or service-listing model.

## Frontend

`main.jsx` mounts React with the Redux store and router. `app/router.jsx` composes guest, seeker and provider route trees. Guest routes are `/`, `/login` and `/join`; seeker routes are `/seeker` and `/seeker/profile`; provider routes are `/provider/dashboard` and `/provider/profile`.

`authAction.js` sends relative Axios requests to `/api/auth/*`. `authSlice.js` groups login/register/refresh pending and fulfilled actions with Redux Toolkit matchers and clears session state on rejection/logout success. Access tokens live in Redux memory, not localStorage.

`ensureSession()` shares an in-flight session check between loaders. With an access token it requests `/api/auth/me`; otherwise it dispatches refresh. `requireRole()` redirects guests and users whose role differs from the route. These are browser checks, not API authorization.

## Backend

`src/server.js` connects Mongoose and listens on port 3000. `app/app.js` mounts JSON parsing, cookie parsing and the authentication router. Validators precede the registration/login controllers. The `authenticate` middleware checks the bearer access JWT for `/me`.

The User model contains name, unique email, password hash, role and one refresh-token value. The application currently stores the raw refresh JWT in that record. A unique email schema option depends on MongoDB's actual index and is not a complete duplicate-request handler.

## Session lifecycle

1. Registration accepts name, email, password, confirmPassword and role; the controller hashes the password with bcrypt cost 12 and creates the user.
2. Registration/login issue an access JWT in JSON and a refresh JWT in an HttpOnly cookie, then store the refresh JWT on the user record.
3. The client stores the access JWT/user in Redux. Its Axios instance attaches `Authorization: Bearer <access-token>` to authenticated requests.
4. `/me` verifies the JWT, then retrieves the user. No role-restricted marketplace endpoint exists yet.
5. Refresh verifies the cookie JWT and compares it with the stored value. Matching values cause token reissuance and a stored-token update; mismatch clears the stored token.
6. Logout clears the cookie and stored token when a matching cookie is supplied.

Reissuance is not a fully verified replay-protection design. Tokens have no unique `jti`, and identical claims signed within one second may produce the same JWT. The current design has one stored refresh token per user, not independent device sessions or a token-family store.

## Deployment boundary

The Vite development server proxies `/api` to localhost:3000. Vite preview does not configure that API proxy. Production deployment, CORS policy, HTTPS, cookie attributes, database access and SPA fallback remain deployment work. There is no verified public demo URL.
