import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { ACCESS_TOKEN_SECONDS, REFRESH_TOKEN_SECONDS, TOKEN_AUDIENCE, TOKEN_ISSUER, USER_ROLES } from "../constants/auth.constants.js";
import { HttpError } from "./http-error.js";

function signToken({ userId, role }, tokenType, secret, lifetime) {
  return jwt.sign({ userId: String(userId), role, tokenType }, secret, {
    algorithm: "HS256",
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn: lifetime,
    jwtid: randomUUID(),
  });
}

function verifyToken(token, tokenType, secret) {
  try {
    const claims = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    if (typeof claims !== "object" || !claims || claims.tokenType !== tokenType ||
        typeof claims.userId !== "string" || !/^[a-f0-9]{24}$/i.test(claims.userId) ||
        !USER_ROLES.includes(claims.role) || typeof claims.jti !== "string" || !claims.jti ||
        !Number.isInteger(claims.exp)) {
      throw new HttpError(401, `Invalid or expired ${tokenType} token`, "UNAUTHENTICATED");
    }
    return claims;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new HttpError(401, `Invalid or expired ${tokenType} token`, "UNAUTHENTICATED");
    }
    throw error;
  }
}

export const createAccessToken = (payload) => signToken(payload, "access", config.ACCESS_TOKEN_SECRET, ACCESS_TOKEN_SECONDS);
export const createRefreshToken = (payload) => signToken(payload, "refresh", config.REFRESH_TOKEN_SECRET, REFRESH_TOKEN_SECONDS);
export const readAccessToken = (token) => verifyToken(token, "access", config.ACCESS_TOKEN_SECRET);
export const readRefreshToken = (token) => verifyToken(token, "refresh", config.REFRESH_TOKEN_SECRET);
export const hashRefreshToken = (token) => createHash("sha256").update(token).digest("hex");
