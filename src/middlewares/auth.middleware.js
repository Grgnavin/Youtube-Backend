import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from  "jsonwebtoken";


export const verifyJWT = asyncHandler(async(req, _ , next) => {
    try {
        const token = req.cookies?.accessToken || req.header["Authorization"]?.replace("Bearer ", "")
        console.log(req.cookie);
        console.log('Extracted Token:', token);
        if (!token) {
            throw new ApiError(401, "Unauthorized Request & The token must be a string")
        }
        
         // Log the extracted token for debugging
        //verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decodedToken) {
            throw new ApiError(402, "Error while decoding")
        }
        //find the user by id
        const user =await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if(!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    
    } catch (error) {
        console.log("JWT verification error: ", error?.message)
        throw new ApiError(401, error?.message || "Invalid access Token")
    }
})
