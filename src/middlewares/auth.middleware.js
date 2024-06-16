import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from  "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req, _ , next) => {
    try {
        // console.log('Cookies: ', req.cookies); // Debugging
        const token = req.cookies?.accessToken || req.headers['authorization']?.replace("Bearer ", "");
        // console.log("Token: ", req.headers);
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }
        // console.log("Extracted Token: ", token);
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodeToken?._id).select(
            "-password -refreshToken"
        );
        // console.log('User from DB: ', user); // Debugging
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Token has expired", error);
        } else if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid token");
        } else {
            throw new ApiError(401, error.message || "Invalid access token");
        }
    }
    }
);

