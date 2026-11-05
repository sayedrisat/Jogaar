import config from "../config/config.js";
import { REFRESH_TOKEN_SECONDS } from "../constants/auth.constants.js";

export function refreshCookieOptions(isProduction = config.isProduction) {
  return { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/" };
}

export function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    ...refreshCookieOptions(),
    maxAge: REFRESH_TOKEN_SECONDS * 1000,
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", refreshCookieOptions());
}
