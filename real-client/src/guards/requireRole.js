
import { redirect } from "react-router";
import { ensureSession } from "../services/ensureSession";

export const requireRole = (allowedRole) => async () => {
  const user = await ensureSession();

  // Guest
  if (!user) {
    return redirect("/");
  }

  // Authorized
  if (user.role === allowedRole) {
    return user;
  }

  // Wrong role
  if (user.role === "provider") {
    return redirect("/provider/dashboard");
  }

  if (user.role === "seeker") {
    return redirect("/seeker");
  }

  return redirect("/");
};
