import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { loginValidator, registerValidator } from "../validator/auth.validator.js";
import { getMeController, loginController, logoutController, refreshController, registerController } from "../controller/auth.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { requireSameOrigin } from "../middleware/origin.middleware.js";
import { USER_ROLES } from "../constants/auth.constants.js";

function limiter(limit, skipSuccessfulRequests = false) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    skipSuccessfulRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ message: "Too many attempts. Try again later.", code: "RATE_LIMITED" }),
  });
}

export function createAuthRouter({ authLimit = 20, refreshLimit = 120 } = {}) {
  const router = Router();
  const loginLimiter = limiter(authLimit, true);
  const registrationLimiter = limiter(authLimit);
  const sessionLimiter = limiter(refreshLimit);
  router.post("/register", requireSameOrigin, registrationLimiter, registerValidator, registerController);
  router.post("/login", requireSameOrigin, loginLimiter, loginValidator, loginController);
  router.post("/refresh", requireSameOrigin, sessionLimiter, refreshController);
  router.post("/logout", requireSameOrigin, sessionLimiter, logoutController);
  router.get("/me", authenticate, authorize(...USER_ROLES), getMeController);
  return router;
}
