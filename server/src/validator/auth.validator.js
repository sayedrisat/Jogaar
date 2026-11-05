import { body, validationResult } from "express-validator"

/**
 * ✦ validation for Register
 * @name Required, string, 2-50 chars
 * @email Required, valid email format
 * @password Required, string, 8-128 chars, must contain:
 * At least one uppercase letter ([A-Z])
 * At least one lowercase letter ([a-z])
 * At least one number ([0-9])
 * At least one special character ([^A-Za-z0-9])
 * @confirmPassword Required, must match password field
 * @param req
 * @returns res
 * @call next
 */

export const registerValidator = [
    body("name")
        .exists().withMessage("Name is Required").bail()
        .isString().withMessage("Name must be type string")
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage("Name length must be between 2 and 50 characters"),
    body("email")
        .exists().withMessage("Email is Required").bail()
        .trim()
        .isEmail().withMessage("Enter a valid email address").bail(),
    body("role")
        .trim()
        .isString().withMessage("Role must be type string").bail(),
    body("password")
        .exists().withMessage("Password is required").bail()
        .isString().withMessage("Password must be a string").bail()
        .trim()
        .isLength({ min: 8, max: 128 }).withMessage("Password must be between 8 and 128 characters").bail()
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter").bail()
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter").bail()
        .matches(/[0-9]/).withMessage("Password must contain at least one number").bail()
        .matches(/[^A-Za-z0-9]/).withMessage("Password must contain at least one special character"),
    body("confirmPassword")
        .exists().withMessage("Confirm password is required").bail()
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords do not match"),

    (req, res, next) => {
        const error = validationResult(req)
        if(!error.isEmpty()){
            return res.status(401).json({
                message: "invalid Request",
                errors: error.array()
            })
        }

        next();
    }
]

/**
 * ✦ Validator for login
 * @email Required, valid email format
 * @password Required, string (no complexity checks on login)
 *
 * @param req
 * @returns res
 * @call next
 */


export const loginValidator = [
    body("email")
        .exists().withMessage("Email is Required").bail()
        .trim()
        .isEmail().withMessage("Enter a valid email address"),
    body("password")
        .exists().withMessage("Password is required").bail()
        .isString().withMessage("Password must be a string"),

    (req, res, next) => {
        const error = validationResult(req)
        if(!error.isEmpty()){
            return res.status(401).json({
                message: "invalid Request",
                errors: error.array()
            })
        }

        next();
    }
]