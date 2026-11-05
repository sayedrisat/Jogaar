import express from "express";
import cookieParser from "cookie-parser";
import { createAuthRouter } from "../routes/auth.routes.js";
import { errorHandler } from "../middleware/error.middleware.js";

export function createApp(options) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(cookieParser());
  app.use("/api/auth", createAuthRouter(options));
  app.use((req, res) => res.status(404).json({ message: "Route not found", code: "NOT_FOUND" }));
  app.use(errorHandler);
  return app;
}

export default createApp();
