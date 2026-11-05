import config from "../config/config.js";
import { HttpError } from "../utils/http-error.js";

export function requireSameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (!origin) return next();
  try {
    const url = new URL(origin);
    if (["http:", "https:"].includes(url.protocol) && url.origin === origin &&
        url.origin === (config.PUBLIC_ORIGIN ?? `${req.protocol}://${req.get("host")}`)) {
      return next();
    }
  } catch {
    // Malformed Origin headers are rejected with the same policy as foreign origins.
  }
  throw new HttpError(403, "Cross-origin session requests are not allowed", "ORIGIN_FORBIDDEN");
}
