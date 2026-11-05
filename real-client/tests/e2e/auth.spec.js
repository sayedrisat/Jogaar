import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const requireServer = createRequire(new URL("../../../server/package.json", import.meta.url));
const jwt = requireServer("jsonwebtoken");
const password = "Browser-fixture-5Nov!";

async function register(page, role) {
  const email = `${role}.${randomUUID()}@example.test`;
  await page.goto("/join");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Full name", { exact: true }).fill("Browser Fixture");
  const roleInput = page.getByRole("radio", { name: new RegExp(role, "i") });
  await roleInput.locator("..").click();
  await expect(roleInput).toBeChecked();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  const response = page.waitForResponse(r => r.url().endsWith("/api/auth/register") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  const result = await response;
  expect(result.status()).toBe(201);
  const data = await result.json();
  await expect(page).toHaveURL(role === "provider" ? /\/provider\/dashboard$/ : /\/seeker$/);
  return { email, user: data.data.user };
}

async function logout(page) {
  await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Join Jogaar", exact: true })).toBeVisible();
}

for (const role of ["seeker", "provider"]) {
  test(`${role}: register, reload session, enforce role route and log out`, async ({ page, context }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await register(page, role);
    const cookie = (await context.cookies()).find(c => c.name === "refreshToken");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Lax");
    await page.reload();
    await expect(page).toHaveURL(role === "provider" ? /\/provider\/dashboard$/ : /\/seeker$/);
    await page.goto(role === "provider" ? "/seeker" : "/provider/dashboard");
    await expect(page).toHaveURL(role === "provider" ? /\/provider\/dashboard$/ : /\/seeker$/);
    await logout(page);
    expect((await context.cookies()).some(c => c.name === "refreshToken")).toBe(false);
    await page.goto(role === "provider" ? "/provider/dashboard" : "/seeker");
    await expect(page).toHaveURL(/\/$/);
    expect(errors).toEqual([]);
  });
}

test("wrong-password login shows a safe error, then valid login succeeds", async ({ page }) => {
  const account = await register(page, "seeker");
  await logout(page);
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill("Wrong-fixture-1!");
  await page.getByRole("dialog").getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid email or password");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("dialog").getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/seeker$/);
});

test("an expired access JWT is refreshed through the real API during navigation", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const { user } = await register(page, "seeker");
  const expired = jwt.sign({ userId: user.id, role: user.role, tokenType: "access" }, process.env.JOGAAR_E2E_ACCESS_SECRET, {
    issuer: "jogaar", audience: "jogaar-web", jwtid: "expired-browser-fixture", expiresIn: -1,
  });
  await page.route("**/api/auth/me", route => route.continue({
    headers: { ...route.request().headers(), authorization: `Bearer ${expired}` },
  }), { times: 1 });
  const refresh = page.waitForResponse(r => r.url().endsWith("/api/auth/refresh") && r.status() === 200);
  const unauthorized = page.waitForResponse(r => r.url().endsWith("/api/auth/me") && r.status() === 401);
  // Revisiting the current URL revalidates the role loader; a child-only
  // navigation reuses the existing parent loader instead.
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await unauthorized;
  await refresh;
  await expect(page).toHaveURL(/\/seeker$/);
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/\/seeker\/profile$/);
  await expect(page.locator(".app-main").getByText("Profile", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
