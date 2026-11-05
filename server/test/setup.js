import { randomBytes, randomUUID } from "node:crypto";

process.env.NODE_ENV = "test";
delete process.env.PUBLIC_ORIGIN;
process.env.ACCESS_TOKEN_SECRET = randomBytes(48).toString("hex");
process.env.REFRESH_TOKEN_SECRET = randomBytes(48).toString("hex");
const uri = new URL(process.env.TEST_MONGO_URI ?? "mongodb://127.0.0.1:27017");
uri.pathname = `/jogaar_auth_test_${randomUUID().replaceAll("-", "")}`;
uri.searchParams.set("serverSelectionTimeoutMS", "3000");
process.env.MONGO_URI = uri.toString();
process.env.PORT = "0";
