import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from  "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req, _ , next) => {
    try {
        // console.log('Cookies: ', req.cookies); // Debugging
        // console.log('Headers: ', req.headers); // Debugging
        const token = req.cookies?.accessToken || req.headers['Authorization']?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log("Decoded Token: ",decodeToken);
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
        throw new ApiError(401, error?.message || "Invalid access token")
    }
});

