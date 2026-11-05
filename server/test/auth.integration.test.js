import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { once } from "node:events";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app/app.js";
import config from "../src/config/config.js";
import User from "../src/model/user.model.js";
import { createAccessToken, createRefreshToken, hashRefreshToken, readRefreshToken } from "../src/utils/auth.utils.js";
import { TOKEN_ISSUER, TOKEN_AUDIENCE } from "../src/constants/auth.constants.js";

let server;
let base;
const registration = (overrides = {}) => ({ name: "Fixture User", email: "fixture@example.test", role: "seeker", password: "Fixture-only-5Nov!", confirmPassword: "Fixture-only-5Nov!", ...overrides });
const cookieFrom = response => response.cookie?.split(";")[0];

async function send(path, { body, cookie, token, rawBody, headers = {}, url = base } = {}) {
  const response = await fetch(url + path, {
    method: body !== undefined || rawBody !== undefined ? "POST" : "GET",
    headers: { ...(body !== undefined || rawBody !== undefined ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(rawBody !== undefined ? { body: rawBody } : {}),
    signal: AbortSignal.timeout(8000),
  });
  assert.match(response.headers.get("content-type"), /application\/json/);
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie"), headers: response.headers };
}

before(async () => {
  assert.match(new URL(config.MONGO_URI).pathname, /^\/jogaar_auth_test_/);
  await mongoose.connect(config.MONGO_URI);
  await User.init();
  server = createApp({ authLimit: 1000, refreshLimit: 1000 }).listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => { await User.deleteMany({}); });

after(async () => {
  if (server) { server.close(); await once(server, "close"); }
  if (mongoose.connection.readyState === 1) {
    assert.match(mongoose.connection.name, /^jogaar_auth_test_/);
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

for (const role of ["seeker", "provider"]) {
  test(`${role}: register, inspect user, login, rotate and logout against real MongoDB`, async () => {
    const credentials = registration({ role });
    const created = await send("/api/auth/register", { body: credentials });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.user.role, role);
    assert.equal(created.body.data.user.email, credentials.email);
    assert.match(created.cookie, /HttpOnly/);
    assert.match(created.cookie, /SameSite=Lax/);
    assert.match(created.cookie, /Max-Age=604800/);
    assert.match(created.cookie, /Path=\//);
    assert.equal(created.cookie.includes("Secure"), false);
    assert.equal(created.body.data.user.passwordHash, undefined);
    assert.equal(created.body.data.user.refreshToken, undefined);
    const stored = await User.findById(created.body.data.user.id).select("+refreshToken +passwordHash");
    const raw = cookieFrom(created).slice("refreshToken=".length);
    assert.equal(stored.refreshToken, hashRefreshToken(raw));
    assert.notEqual(stored.passwordHash, credentials.password);
    const hidden = await User.findById(stored._id);
    assert.equal(hidden.passwordHash, undefined);
    assert.equal(hidden.refreshToken, undefined);

    const me = await send("/api/auth/me", { token: created.body.data.accessToken });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.id, String(stored._id));
    const login = await send("/api/auth/login", { body: { email: credentials.email, password: credentials.password } });
    assert.equal(login.status, 200);
    const refresh = await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(login) });
    assert.equal(refresh.status, 200);
    assert.notEqual(cookieFrom(refresh), cookieFrom(login));
    const replay = await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(login) });
    assert.equal(replay.status, 401);
    assert.equal(replay.cookie, null);
    const current = await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(refresh) });
    assert.equal(current.status, 200);
    const logout = await send("/api/auth/logout", { body: {}, cookie: cookieFrom(current) });
    assert.equal(logout.status, 200);
    assert.match(logout.cookie, /Expires=Thu, 01 Jan 1970/);
    assert.match(logout.cookie, /Path=\//);
    assert.equal((await User.findById(stored._id).select("+refreshToken")).refreshToken, null);
    assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(current) })).status, 401);
  });
}

test("unsupported roles and role type coercion are rejected before creating users", async () => {
  for (const role of ["admin", "", null, 123, ["seeker"], { role: "provider" }]) {
    const response = await send("/api/auth/register", { body: registration({ role }) });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "VALIDATION_ERROR");
    assert.equal(response.cookie, null);
  }
  assert.equal(await User.countDocuments(), 0);
});

test("validation errors do not reflect passwords or other rejected values", async () => {
  const password = "private-lowercase-value";
  const response = await send("/api/auth/register", { body: registration({ password, confirmPassword: password }) });
  assert.equal(response.status, 400);
  assert.equal(JSON.stringify(response.body).includes(password), false);
  assert.equal(response.body.errors.every(error => !Object.hasOwn(error, "value")), true);
  assert.equal(await User.countDocuments(), 0);
});

test("missing fields, invalid email and confirmation mismatch produce validation JSON", async () => {
  for (const body of [{}, registration({ email: "not-email" }), registration({ confirmPassword: "different" }), registration({ name: 123 }), registration({ password: 123 })]) {
    const response = await send("/api/auth/register", { body });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "VALIDATION_ERROR");
  }
  assert.equal(await User.countDocuments(), 0);
});

test("passwords preserve whitespace and reject bcrypt's UTF-8 truncation boundary", async () => {
  const password = " Fixture-only-5Nov! ";
  assert.equal((await send("/api/auth/register", { body: registration({ password, confirmPassword: password }) })).status, 201);
  assert.equal((await send("/api/auth/login", { body: { email: "fixture@example.test", password } })).status, 200);
  assert.equal((await send("/api/auth/login", { body: { email: "fixture@example.test", password: password.trim() } })).status, 401);
  const tooLong = "Aa1!" + "অ".repeat(24);
  assert.equal((await send("/api/auth/register", { body: registration({ email: "long@example.test", password: tooLong, confirmPassword: tooLong }) })).status, 400);
});

test("duplicate registration stops with 409 and preserves the existing session", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  const before = await User.findById(created.body.data.user.id).select("+refreshToken");
  const duplicate = await send("/api/auth/register", { body: registration() });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.code, "EMAIL_EXISTS");
  assert.equal(duplicate.cookie, null);
  assert.equal(await User.countDocuments(), 1);
  assert.equal((await User.findById(before._id).select("+refreshToken")).refreshToken, before.refreshToken);
});

test("concurrent duplicate registrations are protected by the real unique index", async () => {
  const responses = await Promise.all([send("/api/auth/register", { body: registration() }), send("/api/auth/register", { body: registration() })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
  assert.equal(await User.countDocuments(), 1);
  assert.equal(responses.find(r => r.status === 409).body.code, "EMAIL_EXISTS");
});

test("unknown-user and wrong-password login are both 401 without session writes", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  const before = await User.findById(created.body.data.user.id).select("+refreshToken");
  const wrong = await send("/api/auth/login", { body: { email: "fixture@example.test", password: "Wrong-password-1!" } });
  const missing = await send("/api/auth/login", { body: { email: "missing@example.test", password: "Wrong-password-1!" } });
  assert.equal(wrong.status, 401); assert.equal(missing.status, 401);
  assert.deepEqual(wrong.body, missing.body);
  assert.equal(wrong.cookie, null);
  assert.equal((await User.findById(before._id).select("+refreshToken")).refreshToken, before.refreshToken);
});

test("missing, malformed, invalid and expired bearer tokens return 401 JSON", async () => {
  for (const authorization of [undefined, "Basic invalid", "Bearer", "Bearer a b", "Bearer invalid-token"]) {
    const response = await send("/api/auth/me", { headers: authorization ? { Authorization: authorization } : {} });
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHENTICATED");
  }
  const expired = jwt.sign({ userId: "507f1f77bcf86cd799439011", role: "seeker", tokenType: "access" }, config.ACCESS_TOKEN_SECRET, { issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, jwtid: "expired", expiresIn: -1 });
  assert.equal((await send("/api/auth/me", { token: expired })).status, 401);
});

test("missing, invalid and expired refresh cookies are rejected without database changes", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  const id = created.body.data.user.id;
  const before = await User.findById(id).select("+refreshToken");
  const expired = jwt.sign({ userId: id, role: "seeker", tokenType: "refresh" }, config.REFRESH_TOKEN_SECRET, { issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, jwtid: "expired", expiresIn: -1 });
  for (const cookie of [undefined, "refreshToken=invalid", `refreshToken=${expired}`]) {
    const response = await send("/api/auth/refresh", { body: {}, cookie });
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHENTICATED");
    assert.equal(response.cookie, null);
  }
  assert.equal((await User.findById(id).select("+refreshToken")).refreshToken, before.refreshToken);
});

test("a mismatched signed refresh token does not revoke the current session", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  const mismatch = createRefreshToken({ userId: created.body.data.user.id, role: "seeker" });
  assert.equal((await send("/api/auth/refresh", { body: {}, cookie: `refreshToken=${mismatch}` })).status, 401);
  assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(created) })).status, 200);
});

test("atomic refresh allows exactly one concurrent winner without clearing its cookie", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  const responses = await Promise.all([send("/api/auth/refresh", { body: {}, cookie: cookieFrom(created) }), send("/api/auth/refresh", { body: {}, cookie: cookieFrom(created) })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 401]);
  assert.equal(responses.find(r => r.status === 401).cookie, null);
  const winner = responses.find(r => r.status === 200);
  assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(winner) })).status, 200);
});

test("deleted users and role-changed users cannot reuse their previous sessions", async () => {
  for (const action of ["delete", "role-change"]) {
    const created = await send("/api/auth/register", { body: registration({ email: `${action}@example.test` }) });
    if (action === "delete") await User.deleteOne({ _id: created.body.data.user.id });
    else await User.updateOne({ _id: created.body.data.user.id }, { role: "provider" });
    assert.equal((await send("/api/auth/me", { token: created.body.data.accessToken })).status, 401);
    assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(created) })).status, 401);
  }
});

test("a new login invalidates older refresh tokens; stale logout cannot revoke the new login", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  const login = await send("/api/auth/login", { body: { email: "fixture@example.test", password: registration().password } });
  assert.equal((await send("/api/auth/logout", { body: {}, cookie: cookieFrom(created) })).status, 200);
  assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(created) })).status, 401);
  assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(login) })).status, 200);
});

test("legacy plaintext refresh storage is rejected and replaced on next login", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  const raw = cookieFrom(created).slice("refreshToken=".length);
  await User.updateOne({ _id: created.body.data.user.id }, { refreshToken: raw });
  assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(created) })).status, 401);
  const login = await send("/api/auth/login", { body: { email: "fixture@example.test", password: registration().password } });
  assert.equal(login.status, 200);
  assert.match((await User.findById(created.body.data.user.id).select("+refreshToken")).refreshToken, /^[a-f0-9]{64}$/);
});

test("logout is idempotent without a valid refresh cookie", async () => {
  for (const cookie of [undefined, "refreshToken=invalid"]) {
    const response = await send("/api/auth/logout", { body: {}, cookie });
    assert.equal(response.status, 200);
    assert.match(response.cookie, /Expires=Thu, 01 Jan 1970/);
  }
});

test("foreign, null and malformed origins cannot rotate or clear cookie sessions", async () => {
  const created = await send("/api/auth/register", { body: registration() });
  for (const origin of ["https://foreign.example", "null", "broken-origin"]) {
    for (const path of ["refresh", "logout"]) {
      const response = await send(`/api/auth/${path}`, { body: {}, cookie: cookieFrom(created), headers: { Origin: origin } });
      assert.equal(response.status, 403); assert.equal(response.cookie, null);
    }
  }
  assert.equal((await send("/api/auth/refresh", { body: {}, cookie: cookieFrom(created), headers: { Origin: base } })).status, 200);
});

test("malformed JSON, oversized bodies and unknown routes use JSON errors", async () => {
  assert.equal((await send("/api/auth/login", { rawBody: "{broken" })).status, 400);
  assert.equal((await send("/api/auth/login", { body: { large: "x".repeat(20_000) } })).status, 413);
  assert.equal((await send("/not-a-route")).status, 404);
});

async function limitedApp(t, options) {
  const instance = createApp(options).listen(0, "127.0.0.1");
  await once(instance, "listening");
  t.after(async () => { instance.close(); await once(instance, "close"); });
  return `http://127.0.0.1:${instance.address().port}`;
}

test("failed login attempts receive a bounded rate limit and Retry-After", async (t) => {
  const url = await limitedApp(t, { authLimit: 2 });
  const body = { email: "missing@example.test", password: "Wrong-password-1!" };
  assert.equal((await send("/api/auth/login", { body, url })).status, 401);
  assert.equal((await send("/api/auth/login", { body, url })).status, 401);
  const response = await send("/api/auth/login", { body, url });
  assert.equal(response.status, 429);
  assert.equal(response.body.code, "RATE_LIMITED");
  assert(Number(response.headers.get("retry-after")) > 0);
});

test("successful logins do not consume the failed-attempt budget", async (t) => {
  await send("/api/auth/register", { body: registration() });
  const url = await limitedApp(t, { authLimit: 2 });
  for (let i = 0; i < 3; i++) {
    assert.equal((await send("/api/auth/login", { body: { email: "fixture@example.test", password: registration().password }, url })).status, 200);
  }
});

test("refresh requests have their own rate limit", async (t) => {
  const url = await limitedApp(t, { refreshLimit: 2 });
  assert.equal((await send("/api/auth/refresh", { body: {}, url })).status, 401);
  assert.equal((await send("/api/auth/refresh", { body: {}, url })).status, 401);
  assert.equal((await send("/api/auth/refresh", { body: {}, url })).status, 429);
});


test("successful registrations consume their own abuse budget", async (t) => {
  const url = await limitedApp(t, { authLimit: 2 });
  for (let i = 0; i < 2; i++) {
    assert.equal((await send("/api/auth/register", { body: registration({ email: `signup${i}@example.test` }), url })).status, 201);
  }
  const rejected = await send("/api/auth/register", { body: registration({ email: "limited@example.test" }), url });
  assert.equal(rejected.status, 429);
  assert.equal(await User.countDocuments(), 2);
});
