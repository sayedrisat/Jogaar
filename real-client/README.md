# Jogaar frontend

React and Redux Toolkit client for the **Jogaar marketplace, in active development**. It contains the landing page, authentication dialogs, role-aware navigation and session state. Provider dashboard tools, editable profiles, listings and bookings remain unfinished.

See the [project README](../README.md) for API setup and [verification status](../docs/STATUS.md) for evidence and limits.

## Development

Use Node.js 24. Start the API from `../server`, then:

```bash
npm ci
npm run dev
```

Vite proxies `/api` to localhost:3000 in both development and preview. Set `JOGAAR_API_TARGET` for an alternate API address. Without the API, sign-in/session requests fail.

```bash
npm run lint
npm run test:unit
npm run build
npm run preview
```

The access token stays in Redux memory. Session loaders deduplicate pending checks, refresh after `/me` returns 401 and propagate other `/me` errors. Client role guards control navigation; API resources still require server authorization.

## Browser tests

Start a disposable local MongoDB instance, then:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright builds the production client, starts preview with an isolated real API, generates test secrets and uses a temporary `jogaar_browser_test_*` database. Teardown deletes only that database. It never reads backend `.env`. `TEST_MONGO_URI` can select a separate test MongoDB host. Do not use production infrastructure.

The four Chromium tests cover both roles, cookie-backed reload, wrong-role redirects, logout, failed/successful login and expired-access-token recovery. Unit tests separately cover Redux/session errors and refresh deduplication. `npm test` runs both suites. Generated reports/builds are ignored by Git.

## Key paths

- `src/app/`: router and Redux store.
- `src/features/auth/`: session reducer, forms and dialogs.
- `src/actions/authAction.js`: API thunks.
- `src/services/ensureSession.js`: shared session lookup/refresh.
- `src/guards/`: role and guest navigation.
- `src/shared/`: navigation, branding and themes.
- `tests/` and `playwright.config.js`: unit/browser regressions and isolated test infrastructure.
