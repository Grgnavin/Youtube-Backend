import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCLoudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import util from "util";


const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken =await  user.generateAccessToken();
        const refreshToken =await  user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the access and refresh token=")
    }
}

const registerUser = asyncHandler(async(req, res) =>{
    //get users details from the frontend
    //validation - any field is not empty
    //check if the user already exits by username and email
    //check for avatar and images: if yes upload them in cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from the response
    //check for user creation
    //return response
    const { username, fullName, email, password } = req.body;
    // console.log(req.body);
    // console.log("Email: ", email);

    if (
        [fullName , username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar =await uploadOnCLoudinary(avatarLocalPath);
    const coverImage =await uploadOnCLoudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName  ,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    })

    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registrying the user")
    }

    return res.status(201).json(
        new ApiResponse(createdUser, 200, "User registred successfully")
    )

})

const loginUser = asyncHandler(async(req,res) => {
    //req-body => data
    //username || email
    //find the user
    //check the password
    //generate accessToken and reFresh token 
    //send via cookies
    const { username, email, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User doesn't exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user passwords")
    }

    const { accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser =await User.findById(user._id).select(" -password -refreshToken ");
    
    console.log(util.inspect(loggedInUser, { showHidden: false, depth: null, colors: true }));

    const options= {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    200,
                    "User loggedin Successfully"
                )
            )
})  

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options= {
        httpOnly: true,
        secure: true
    }

    return res
            .status(201)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json(
                    new ApiResponse({}, 200, "User LoggedOut Sucessfully")
                )

})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies || req.body;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized requests")
    }
try {
    
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options  = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token refresh...Successfully"
                )
            )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}