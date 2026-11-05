import { Router } from "express";
import { loginValidator, registerValidator } from "../validator/auth.validator.js";
import { getMeController, loginController, logoutController, refreshController, registerController } from "../controller/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router()

/**
 * @post /api/auth/register
 * @param req {name, email, password,role, confirmPassword}
 * @middleware registerValidator to validate
 * @returns res {201 - account created} if successfull
 * @returns res {401 - email already exist} if failed
 */

router.post("/register", registerValidator, registerController)


/**
 * @post /api/auth/login
 * @param req {email, password}
 * @middleware loginValidator to validate
 * @returns res {201 - redirect home} if successfull
 * @returns res {401 - Invalid Credential} if failed
 */

router.post("/login", loginValidator, loginController)

/**
 * @post /api/auth/logout
 * @param req refresh token from cookies
 * @returns res 200 if loggout success.
 */

router.post("/logout", logoutController)

/**
 * @post /api/auth/refresh
 * @param req refreshToken from cookies
 * @returns res {accessToken} refreshToken -> cookie
 */

router.post("/refresh", refreshController)

/**
 * @get /api/auth/me
 * @param req 
 * @middleware authenticate user
 * @returns res user information
 */

router.get("/me", authenticate, getMeController)

export default router