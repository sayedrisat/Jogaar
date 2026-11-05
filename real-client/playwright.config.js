import { defineConfig, devices } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

async function unusedPort() {
  const server = createServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  server.close(); await once(server, "close");
  return String(port);
}

if (!process.env.JOGAAR_E2E_MONGO_URI) {
  const uri = new URL(process.env.TEST_MONGO_URI ?? "mongodb://127.0.0.1:27017");
  uri.pathname = `/jogaar_browser_test_${randomUUID().replaceAll("-", "")}`;
  uri.searchParams.set("serverSelectionTimeoutMS", "3000");
  process.env.JOGAAR_E2E_MONGO_URI = uri.toString();
  process.env.JOGAAR_E2E_ACCESS_SECRET = randomBytes(48).toString("hex");
  process.env.JOGAAR_E2E_REFRESH_SECRET = randomBytes(48).toString("hex");
  process.env.JOGAAR_E2E_API_PORT = await unusedPort();
  do { process.env.JOGAAR_E2E_WEB_PORT = await unusedPort(); }
  while (process.env.JOGAAR_E2E_WEB_PORT === process.env.JOGAAR_E2E_API_PORT);
}

if (!/^\/jogaar_browser_test_/.test(new URL(process.env.JOGAAR_E2E_MONGO_URI).pathname)) {
  throw new Error("Browser tests require a uniquely named test database");
}
const apiOrigin = `http://127.0.0.1:${process.env.JOGAAR_E2E_API_PORT}`;
const webOrigin = `http://127.0.0.1:${process.env.JOGAAR_E2E_WEB_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: "list",
  globalTeardown: "./tests/teardown.js",
  use: { baseURL: webOrigin, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node src/server.js",
      cwd: fileURLToPath(new URL("../server/", import.meta.url)),
      url: `${apiOrigin}/api/auth/me`,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        PORT: process.env.JOGAAR_E2E_API_PORT,
        MONGO_URI: process.env.JOGAAR_E2E_MONGO_URI,
        ACCESS_TOKEN_SECRET: process.env.JOGAAR_E2E_ACCESS_SECRET,
        REFRESH_TOKEN_SECRET: process.env.JOGAAR_E2E_REFRESH_SECRET,
        PUBLIC_ORIGIN: "",
      },
    },
    {
      command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${process.env.JOGAAR_E2E_WEB_PORT} --strictPort`,
      url: webOrigin,
      reuseExistingServer: false,
      env: { JOGAAR_API_TARGET: apiOrigin },
    },
  ],
});
