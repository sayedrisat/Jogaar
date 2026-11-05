import mongoose from "mongoose";
import { USER_ROLES } from "../constants/auth.constants.js";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: USER_ROLES, default: "seeker", required: true },
  // SHA-256 digest of the current refresh JWT; raw tokens never enter new writes.
  refreshToken: { type: String, default: null, select: false, index: true },
});

export default mongoose.model("users", userSchema);
