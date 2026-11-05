import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import config, { loadConfig } from "../src/config/config.js";
import { createAccessToken, createRefreshToken, readAccessToken, readRefreshToken, hashRefreshToken } from "../src/utils/auth.utils.js";
import { refreshCookieOptions } from "../src/utils/auth-cookie.js";
import { authorize } from "../src/middleware/auth.middleware.js";
import { TOKEN_AUDIENCE, TOKEN_ISSUER } from "../src/constants/auth.constants.js";
import userModel from "../src/model/user.model.js";

const payload = { userId: "507f1f77bcf86cd799439011", role: "seeker" };
const options = { issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, jwtid: "fixture-token", expiresIn: 60 };
const rejects401 = (fn) => assert.throws(fn, error => error.status === 401 && error.code === "UNAUTHENTICATED");

test("access and refresh tokens have the expected lifetimes and purpose", () => {
  const access = readAccessToken(createAccessToken(payload));
  const refresh = readRefreshToken(createRefreshToken(payload));
  assert.equal(access.exp - access.iat, 900);
  assert.equal(refresh.exp - refresh.iat, 604800);
  assert.equal(access.tokenType, "access");
  assert.equal(refresh.tokenType, "refresh");
  assert.equal(refresh.userId, payload.userId);
});

test("refresh IDs stay unique when time is frozen to the same second", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-05T12:00:00Z").getTime() });
  const first = createRefreshToken(payload);
  const second = createRefreshToken(payload);
  assert.notEqual(first, second);
  assert.notEqual(readRefreshToken(first).jti, readRefreshToken(second).jti);
});

test("refresh digests are deterministic and do not contain the JWT", () => {
  const raw = createRefreshToken(payload);
  assert.match(hashRefreshToken(raw), /^[a-f0-9]{64}$/);
  assert.equal(hashRefreshToken(raw), hashRefreshToken(raw));
  assert.notEqual(hashRefreshToken(raw), raw);
});

test("expired, future, wrong-signature and wrong-algorithm access tokens are rejected", () => {
  const data = { ...payload, tokenType: "access" };
  for (const token of [
    jwt.sign(data, config.ACCESS_TOKEN_SECRET, { ...options, expiresIn: -1 }),
    jwt.sign(data, config.ACCESS_TOKEN_SECRET, { ...options, notBefore: 60 }),
    jwt.sign(data, "a-different-signing-secret", options),
    jwt.sign(data, config.ACCESS_TOKEN_SECRET, { ...options, algorithm: "HS384" }),
  ]) rejects401(() => readAccessToken(token));
});

test("issuer, audience, token purpose and claims are checked", () => {
  const data = { ...payload, tokenType: "access" };
  for (const token of [
    jwt.sign(data, config.ACCESS_TOKEN_SECRET, { ...options, issuer: "other-app" }),
    jwt.sign(data, config.ACCESS_TOKEN_SECRET, { ...options, audience: "other-client" }),
    jwt.sign({ ...data, tokenType: "refresh" }, config.ACCESS_TOKEN_SECRET, options),
    jwt.sign({ ...data, role: "admin" }, config.ACCESS_TOKEN_SECRET, options),
    jwt.sign({ ...data, userId: [payload.userId] }, config.ACCESS_TOKEN_SECRET, options),
    jwt.sign({ ...data, userId: "not-an-object-id" }, config.ACCESS_TOKEN_SECRET, options),
    jwt.sign(data, config.ACCESS_TOKEN_SECRET, { issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE }),
  ]) rejects401(() => readAccessToken(token));
  rejects401(() => readAccessToken(createRefreshToken(payload)));
  rejects401(() => readRefreshToken(createAccessToken(payload)));
});

test("cookie policy is HttpOnly, host-only, SameSite Lax and Secure in production", () => {
  assert.deepEqual(refreshCookieOptions(true), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  assert.equal(refreshCookieOptions(false).secure, false);
  assert.equal(Object.hasOwn(refreshCookieOptions(), "domain"), false);
});

test("role authorization distinguishes unauthenticated, forbidden and allowed users", () => {
  const middleware = authorize("provider");
  assert.throws(() => middleware({}, {}, () => {}), error => error.status === 401);
  assert.throws(() => middleware({ user: { role: "seeker" } }, {}, () => {}), error => error.status === 403);
  let allowed = false;
  middleware({ user: { role: "provider" } }, {}, () => { allowed = true; });
  assert.equal(allowed, true);
});

test("the database schema independently rejects unsupported roles", async () => {
  const doc = new userModel({ name: "Fixture", email: "fixture@example.test", role: "admin", passwordHash: "fixture" });
  await assert.rejects(doc.validate(), error => error.errors.role.kind === "enum");
});

test("configuration rejects absent, short or identical signing secrets and invalid ports", () => {
  const env = { MONGO_URI: "mongodb://127.0.0.1/fixture", ACCESS_TOKEN_SECRET: "a".repeat(32), REFRESH_TOKEN_SECRET: "b".repeat(32) };
  assert.equal(loadConfig(env).PORT, 3000);
  assert.equal(loadConfig({ ...env, NODE_ENV: "production", PUBLIC_ORIGIN: "https://jogaar.example.test" }).isProduction, true);
  for (const key of ["MONGO_URI", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]) {
    assert.throws(() => loadConfig({ ...env, [key]: "" }), /required/);
  }
  assert.throws(() => loadConfig({ ...env, ACCESS_TOKEN_SECRET: "short" }), /32 bytes/);
  assert.throws(() => loadConfig({ ...env, REFRESH_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET }), /different/);
  assert.throws(() => loadConfig({ ...env, PORT: "not-a-port" }), /PORT/);
  assert.throws(() => loadConfig({ ...env, NODE_ENV: "production" }), /PUBLIC_ORIGIN/);
  assert.throws(() => loadConfig({ ...env, NODE_ENV: "production", PUBLIC_ORIGIN: "http://jogaar.example.test" }), /HTTPS/);
  assert.throws(() => loadConfig({ ...env, PUBLIC_ORIGIN: "https://jogaar.example.test/path" }), /exact origin/);
});
