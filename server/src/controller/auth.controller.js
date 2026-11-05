import userModel from "../model/user.model.js";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken, readRefreshToken, hashRefreshToken } from "../utils/auth.utils.js";
import { clearRefreshCookie, setRefreshCookie } from "../utils/auth-cookie.js";
import { HttpError } from "../utils/http-error.js";
import { USER_ROLES } from "../constants/auth.constants.js";

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

function sessionTokens(userId, role) {
  const payload = { userId, role };
  return { accessToken: createAccessToken(payload), refreshToken: createRefreshToken(payload) };
}

export async function registerController(req, res) {
  const { name, email, password, role } = req.body;
  if (await userModel.exists({ email })) {
    throw new HttpError(409, "An account already exists with this email", "EMAIL_EXISTS");
  }
  const user = new userModel({ name, email, role, passwordHash: await bcrypt.hash(password, 12) });
  const tokens = sessionTokens(user._id, user.role);
  user.refreshToken = hashRefreshToken(tokens.refreshToken);
  await user.save();
  setRefreshCookie(res, tokens.refreshToken);
  return res.status(201).json({ message: "Account created", data: { user: publicUser(user), accessToken: tokens.accessToken } });
}

export async function loginController(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  if (!USER_ROLES.includes(user.role)) {
    throw new HttpError(403, "Account role is not supported", "FORBIDDEN");
  }
  const tokens = sessionTokens(user._id, user.role);
  const updated = await userModel.findOneAndUpdate(
    { _id: user._id, role: user.role, passwordHash: user.passwordHash },
    { $set: { refreshToken: hashRefreshToken(tokens.refreshToken) } },
    { returnDocument: "after" },
  );
  if (!updated) throw new HttpError(401, "Session is no longer valid", "UNAUTHENTICATED");
  setRefreshCookie(res, tokens.refreshToken);
  return res.status(200).json({ message: "Signed in", data: { user: publicUser(updated), accessToken: tokens.accessToken } });
}

export async function refreshController(req, res) {
  const token = req.cookies?.refreshToken;
  if (typeof token !== "string" || !token) {
    throw new HttpError(401, "Refresh Token required", "UNAUTHENTICATED");
  }
  const claims = readRefreshToken(token);
  const tokens = sessionTokens(claims.userId, claims.role);
  // Compare and replace in one database operation so only one concurrent refresh wins.
  const user = await userModel.findOneAndUpdate(
    { _id: claims.userId, role: claims.role, refreshToken: hashRefreshToken(token) },
    { $set: { refreshToken: hashRefreshToken(tokens.refreshToken) } },
    { returnDocument: "after" },
  );
  if (!user) throw new HttpError(401, "Session is no longer valid", "UNAUTHENTICATED");
  setRefreshCookie(res, tokens.refreshToken);
  return res.status(200).json({ message: "Session refreshed", data: { user: publicUser(user), accessToken: tokens.accessToken } });
}

export function getMeController(req, res) {
  return res.status(200).json({ message: "User fetched", data: { user: publicUser(req.user) } });
}

export async function logoutController(req, res) {
  const token = req.cookies?.refreshToken;
  if (typeof token === "string" && token) {
    await userModel.updateOne({ refreshToken: hashRefreshToken(token) }, { $set: { refreshToken: null } });
  }
  clearRefreshCookie(res);
  return res.status(200).json({ message: "Signed out" });
}
