import { createRequire } from "node:module";
const requireServer = createRequire(new URL("../../server/package.json", import.meta.url));
const mongoose = requireServer("mongoose");

export default async function teardown() {
  const uri = process.env.JOGAAR_E2E_MONGO_URI;
  if (!uri || !/^\/jogaar_browser_test_/.test(new URL(uri).pathname)) {
    throw new Error("Refusing to remove a non-test database");
  }
  try {
    await mongoose.connect(uri);
    if (!mongoose.connection.name.startsWith("jogaar_browser_test_")) throw new Error("Unexpected database");
    await mongoose.connection.dropDatabase();
  } finally {
    await mongoose.disconnect();
  }
}
