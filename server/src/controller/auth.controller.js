import userModel from "../model/user.model.js"
import bcrypt from "bcryptjs"
import { createAccessToken, createRefreshToken, readRefreshToken } from "../utils/auth.utils.js"


/**
 * ✦ Register controller flow
 * Main motive: create a user in db. if not exits.
 * destructure name, email, password from req.body comes from client
 * check if the user is alreate exist in database or not, 
 * if yes then return with response 401 that user is already exist the following email adress.
 * if no then create a new user with the data.
 * aftar that create accessToken and refreshToken 
 * then response refreshToken set to cookie
 * and update refreshToken in db
 * then responst 201 with creaeted massage, data and accessToken
 * done...
 * @param req
 * @returns res
 */


export const registerController = async (req, res) => {
    const {name, email, password, role} = req.body

    const isUserAlreadyExit = await userModel.findOne({
        email
    })

    if(isUserAlreadyExit){
        res.status(401).json({
            message:"User already exists with this email address",
            error:[
                {
                    path: "email",
                    msg: "User already exists with this email address"
                }

            ]
        })
    }

    const user = await userModel.create({
        name,
        email,
        role,
        passwordHash: await bcrypt.hash(password, 12)
    })

    const accessToken = createAccessToken({
        userId: user._id,
        role: user.role
    })

    const refreshToken = createRefreshToken({
        userId: user._id,
        role: user.role
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true
    })

    await userModel.findByIdAndUpdate(user._id, {refreshToken})

    res.status(201).json({
        message: "User created succesfully",
        data:{
            user:{
                name: user.name,
                role: user.role,
                id: user._id
            },
            accessToken
        }

    })

}


/**
 * ✦ Login controller flow
 * Main motive: login a existing user.
 * destructure email and password from req.body which comes from client
 * find the user by email address
 * if no user found return 401 error with invaild cradandial
 * compare password with db user password 
 * if not matched return 401 error with invaild cradandial
 * if matched then create accesstoken and refreshToken
 * res in cookie set the refreshToken to cookie 
 * then update the refreshToken to database
 * then res 201 with success loggin and send data and accessToken with res
 * done
 * @param req
 * @returns res
 */


export const loginController = async (req, res) => {
    const {email, password} = req.body

    const user = await userModel.findOne({email})
    if(!user){
        res.status(401).json({
            message:"Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if(!isPasswordValid){
        res.status(401).json({
            message:"Invalid email or password"
        })
    }

    const accessToken = createAccessToken({
        userId: user._id, 
        role: user.role
    })

    const refreshToken = createRefreshToken({
        userId: user._id,
        role: user.role
    })

    res.cookie("refreshToken", refreshToken, 
        {
            httpOnly: true
        }
    )

    await userModel.findByIdAndUpdate(user._id, {refreshToken})

    res.status(200).json({
        message:"user loggedin successfully",
        data: {
            user: {
                name: user.name,
                role: user.role,
                id: user._id
            },
            accessToken
        }
    })
}

/**
 * ✦ Refresh Controller flow
 * Main motive: rotate the tokens
 * destructure the refresh token from the req.cookies 
 * check refreshToken exist or not if not response 401 with required message
 * the try and catch if try failed for any reaseon that mean invalid refresh token so res error
 * decode and verify the refresh token comes from client
 * get userId and role after decoded find user by userid, 
 * if found then match the refresh token come from client and the token saved in database
 *  is not match first find user and make the value of refreshToken null then return with 401 missmatch
 * if matched the create new accessToken and refreshToken,
 * send refresh token in cookie with res
 * and update refresh token in database
 * then res with data and accessToken to client
 * done..
 *
 * @param req -> cookies
 * @returns res ->
 */

export const refreshController = async (req, res) => {
    const {refreshToken} = req.cookies

    if(!refreshToken){
        res.status(401).json({
            message: "Refresh Token required"
        })
    }

    try {
        const decoded = readRefreshToken(refreshToken)
        const {userId, role} = decoded

        const user = await userModel.findById(userId)

        if(refreshToken !== user.refreshToken){
            await userModel.findByIdAndUpdate(user._id, {
                refreshToken:null
            })

            return res.status(401).json({
                message:"refresh token missmatch"
            })
        }

        const newAccessToken = createAccessToken({userId, role})
        const newRefreshToken = createRefreshToken({userId, role})

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true
        })

        await userModel.findByIdAndUpdate(user._id, {
            refreshToken: newRefreshToken
        })

        res.status(200).json({
            message: "token roatated successfully",
            data:{
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    id: user._id
                },
                accessToken: newAccessToken
            }
        })

    } catch (error) {
        return res.status(401).json({
            message: "invalid refresh token"
        })
    }
}

/**
 * ✦ get user controller flow
 * destructure userId from req.user comes from client and set in req.user by middleware
 * find user fron db 
 * then res with user data
 * done...
 *
 * @param req
 * @returns res
 */


export const getMeController = async (req, res) => {
    const {userId} = req.user
    const user = await userModel.findById(userId)

    res.status(200).json({
        message: "user fatched successfully",
        data:{
            user:{
                name:user.name,
                email: user.email,
                role: user.role,
                id: user._id
            }
        }
    })
}

export const logoutController = async (req, res) => {
    try {
        const {refreshToken} = req.cookies
        
        if(refreshToken){
            await userModel.findOneAndUpdate({refreshToken}, {refreshToken: null})
        }

        res.clearCookie("refreshToken", {
            httpOnly:true
        })

        return res.status(201).json({
            message: "loggout successfully "
        })
    } catch (error) {
        return res.status(500).json({
            message: "loggout failed"
        })
    }
}