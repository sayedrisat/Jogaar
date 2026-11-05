import { readAccessToken } from "../utils/auth.utils.js"

export const authenticate = (req, res, next) => {
    const accessToken = req.headers.authorization?.split(" ")[1]
    if(!accessToken){
        return res.status(400).json({
            message: "access token required"
        })
    }

    const decode = readAccessToken(accessToken)

    req.user = decode

    next();
}