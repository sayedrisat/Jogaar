import { body, validationResult } from "express-validator";
import { USER_ROLES } from "../constants/auth.constants.js";
import { HttpError } from "../utils/http-error.js";

function rejectInvalidRequest(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true }).map(({ path, msg }) => ({ path, msg }));
    throw new HttpError(400, errors[0].msg, "VALIDATION_ERROR", errors);
  }
  next();
}

const emailRule = () => body("email")
  .isString().withMessage("Email is required").bail()
  .trim().isEmail().withMessage("Enter a valid email address");

const passwordRule = () => body("password")
  .isString().withMessage("Password is required").bail()
  .notEmpty().withMessage("Password is required");

export const registerValidator = [
  body("name").isString().withMessage("Name is required").bail()
    .trim().isLength({ min: 2, max: 50 }).withMessage("Name must contain 2–50 characters"),
  emailRule(),
  body("role").isString().withMessage("Role must be a string").bail()
    .isIn(USER_ROLES).withMessage("Role must be seeker or provider"),
  passwordRule().bail()
    .isLength({ min: 8 }).withMessage("Password must contain at least 8 characters").bail()
    .custom(value => Buffer.byteLength(value, "utf8") <= 72).withMessage("Password must not exceed 72 UTF-8 bytes").bail()
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter").bail()
    .matches(/[a-z]/).withMessage("Password must contain a lowercase letter").bail()
    .matches(/[0-9]/).withMessage("Password must contain a number").bail()
    .matches(/[^A-Za-z0-9]/).withMessage("Password must contain a special character"),
  body("confirmPassword").isString().withMessage("Confirm password is required").bail()
    .custom((value, { req }) => value === req.body.password).withMessage("Passwords do not match"),
  rejectInvalidRequest,
];

export const loginValidator = [
  emailRule(),
  passwordRule().bail()
    .custom(value => Buffer.byteLength(value, "utf8") <= 72).withMessage("Password must not exceed 72 UTF-8 bytes"),
  rejectInvalidRequest,
];
