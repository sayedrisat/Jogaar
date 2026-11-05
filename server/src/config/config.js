import dotenv from "dotenv";

if (process.env.NODE_ENV !== "test") dotenv.config({ quiet: true });

export function loadConfig(env = process.env) {
  for (const key of ["MONGO_URI", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]) {
    if (typeof env[key] !== "string" || !env[key].trim()) {
      throw new Error(`${key} is required`);
    }
  }
  for (const key of ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]) {
    if (Buffer.byteLength(env[key], "utf8") < 32) {
      throw new Error(`${key} must contain at least 32 bytes`);
    }
  }
  if (env.ACCESS_TOKEN_SECRET === env.REFRESH_TOKEN_SECRET) {
    throw new Error("Access and refresh signing secrets must be different");
  }
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535");
  }
  const publicOrigin = env.PUBLIC_ORIGIN || null;
  if (publicOrigin) {
    let origin;
    try { origin = new URL(publicOrigin); } catch { throw new Error("PUBLIC_ORIGIN must be an origin URL"); }
    if (origin.origin !== publicOrigin || !["http:", "https:"].includes(origin.protocol) ||
        (env.NODE_ENV === "production" && origin.protocol !== "https:")) {
      throw new Error("PUBLIC_ORIGIN must be an exact origin, using HTTPS in production");
    }
  } else if (env.NODE_ENV === "production") {
    throw new Error("PUBLIC_ORIGIN is required in production");
  }
  return {
    PUBLIC_ORIGIN: publicOrigin,
    MONGO_URI: env.MONGO_URI,
    ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET,
    PORT: port,
    isProduction: env.NODE_ENV === "production",
  };
}

export default loadConfig();
