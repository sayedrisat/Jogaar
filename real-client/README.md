# Jogaar frontend

React and Redux Toolkit client for the **Jogaar marketplace, in active development**. This package contains the landing page, authentication dialogs, role-aware navigation and session state. Provider dashboard tools, editable profiles, service listings and bookings remain unfinished.

Read the [project README](../README.md) for backend setup, safe environment configuration, architecture, API endpoints and limitations.

## Development

Use Node.js 24 and npm. Start the API from `../server` on port 3000, then:

```bash
npm ci
npm run dev
```

Vite forwards `/api` to localhost:3000. Without the backend, session refresh and sign-in requests fail; a rendered form is not proof of a working login.

```bash
npm run lint
npm run build
npm run preview
```

`build` writes `dist/`. Preview serves the built client without the development API proxy. There is no frontend test script yet. The publication review found four existing unused-import lint errors; see [status](../docs/STATUS.md).

## Key paths

- `src/app/`: router and Redux store.
- `src/features/auth/`: grouped auth action handling, forms and dialogs.
- `src/actions/authAction.js`: API thunks.
- `src/services/ensureSession.js`: shared session lookup/refresh.
- `src/guards/`: browser role and guest navigation.
- `src/shared/`: navigation, branding and theme components.

Access tokens stay in Redux memory. Cookie-backed refresh is handled by the backend. Client role guards are navigation controls; backend authorization must protect every future role-specific resource.
