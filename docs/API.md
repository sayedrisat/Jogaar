# Authentication API — current development contract

Base path: `/api/auth`. Requests with a body use `Content-Type: application/json`. The list below comes from `server/src/routes/auth.routes.js`; it is not a claim that all negative paths pass tests.

| Method | Path | Input / authentication | Success response |
| --- | --- | --- | --- |
| POST | `/register` | JSON `name`, `email`, `role`, `password`, `confirmPassword` | 201, `data.user` and `data.accessToken`; refresh cookie |
| POST | `/login` | JSON `email`, `password` | 200, `data.user` and `data.accessToken`; refresh cookie |
| POST | `/refresh` | `refreshToken` cookie | 200, `data.user` and `data.accessToken`; replacement cookie |
| POST | `/logout` | Optional `refreshToken` cookie | 201, success message; cookie cleared |
| GET | `/me` | `Authorization: Bearer <access-token>` | 200, `data.user` |

Registration and login user responses contain `name`, `role`, and `id`. Refresh and `/me` also return `email`. Access tokens are not returned by `/me` or logout. JWT helpers configure a 15-minute access lifetime and seven-day refresh lifetime.

The forms offer `seeker` and `provider`. **The backend currently checks that role is a string; it does not enforce an allowed-role list.** The model's role option is not a Mongoose `enum`. Do not describe this API as enforcing complete role-based authorization.

## Example registration body

```json
{
  "name": "Example Developer",
  "email": "developer@example.test",
  "role": "seeker",
  "password": "development-example-only-1A!",
  "confirmPassword": "development-example-only-1A!"
}
```

Use disposable development credentials, not this example in a real account. Password registration rules require 8–128 characters, uppercase, lowercase, a number and a non-alphanumeric character. The implementation trims the password during registration.

## Errors and gaps

- Request validators currently return 401 with `message` and an `errors` array.
- Duplicate registration attempts and invalid login branches send 401 but are missing early returns. Subsequent database/token work can still run or throw.
- Missing bearer tokens return 400. Invalid/expired JWTs are not normalized to 401 by the middleware.
- Missing/invalid/mismatched refresh tokens are intended to return 401; missing-cookie early return and missing-user handling need correction.
- There is no shared JSON error handler or server-side role-authorization middleware yet.

Do not build clients around a finalized error schema until those cases are covered and corrected. No listing, booking, payment, messaging, service search, or profile-update endpoint is present.
