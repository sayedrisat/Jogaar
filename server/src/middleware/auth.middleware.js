import userModel from "../model/user.model.js";
import { readAccessToken } from "../utils/auth.utils.js";
import { HttpError } from "../utils/http-error.js";

export async function authenticate(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get("authorization") ?? "");
  if (!match) throw new HttpError(401, "Access token required", "UNAUTHENTICATED");
  const claims = readAccessToken(match[1]);
  const user = await userModel.findById(claims.userId);
  if (!user || user.role !== claims.role) {
    throw new HttpError(401, "Session is no longer valid", "UNAUTHENTICATED");
  }
  req.user = user;
  next();
}

export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) throw new HttpError(401, "Authentication required", "UNAUTHENTICATED");
  if (!allowedRoles.includes(req.user.role)) {
    throw new HttpError(403, "You do not have permission for this action", "FORBIDDEN");
  }
  next();
};
