import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import express from "express";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import { errorHandler } from "../src/middleware/error.middleware.js";

let server;
let base;
before(async () => {
  const app = express();
  app.get("/unexpected", async () => { throw new Error("fixture-private-db-credentials"); });
  app.get("/unavailable", () => { const error = new Error("fixture-private-uri"); error.name = "MongoNetworkError"; throw error; });
  app.use(errorHandler);
  server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.close(); await once(server, "close"); });

test("unexpected asynchronous errors are generic JSON without stack or credentials", async () => {
  const response = await fetch(base + "/unexpected");
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "An unexpected error occurred", code: "INTERNAL_ERROR" });
});

test("database network failures are 503 rather than an authentication failure", async () => {
  const response = await fetch(base + "/unavailable");
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { message: "Database is temporarily unavailable", code: "DATABASE_UNAVAILABLE" });
});

test("database connection failures are propagated", async (t) => {
  const error = new Error("fixture connect failed");
  t.mock.method(mongoose, "connect", async () => { throw error; });
  await assert.rejects(connectDB(), failure => failure === error);
});

test("startup exits without listening when the real database connection fails", async () => {
  const unused = createServer().listen(0, "127.0.0.1"); await once(unused, "listening");
  const port = unused.address().port;
  unused.close(); await once(unused, "close");
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, MONGO_URI: `mongodb://127.0.0.1:${port}/jogaar_auth_test_unavailable?serverSelectionTimeoutMS=100`, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });
  const timer = setTimeout(() => child.kill("SIGKILL"), 8000);
  const [code] = await once(child, "exit"); clearTimeout(timer);
  assert.equal(code, 1);
  assert.match(output, /Unable to start Jogaar API/);
  assert.equal(output.includes("listening on port"), false);
  assert.equal(output.includes("mongodb://"), false);
});
