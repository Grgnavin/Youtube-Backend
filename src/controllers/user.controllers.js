import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCLoudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import util from "util";
import mongoose from "mongoose";


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

//get users details from the frontend
    //validation - any field is not empty
    //check if the user already exits by username and email
    //check for avatar and images: if yes upload them in cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from the response
    //check for user creation
    //return response

const registerUser = asyncHandler(async(req, res) =>{
    
    const { username, fullName, email, password } = req.body;
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

const changePassword = asyncHandler(async(req,res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        throw new ApiError(402, "The newpassword and confirm password should be same..")
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "Cannot find the user")
    }

    const passwordCheck = await user.isPasswordCorrect(oldPassword);

    if (!passwordCheck) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse({}, 201, "The password has been changed sucessfully")
        )
})

const getUser = asyncHandler(async(req,res) => {
    return res.status(200).json( 
        new ApiResponse(
                    req.user,
                    200,
                    "Here are the user details..")
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const { newfullName, newEmail } = req.body

    if (!newfullName || !newEmail) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set: {
                fullName: newfullName,
                email: newEmail
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(user, 200, "All account details updated successfully")
        )
})

const updateAvatarFile = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar file is missing")
    }

    const avatar = await uploadOnCLoudinary(avatarLocalPath);

    if (!avatar || !avatar.url) { // Check if avatar or its url property is null
        throw new ApiError(401, "Error while uploading the files in cloudinary");
    }

    // const user = await User.findByIdAndUpdate(
    //     req.user._id,
    //     { 
    //         $set: {
    //             avatar: avatar.url
    //     } },
    //     { new: true }
    // ).select("-password")

    const user = await User.findById(req.user._id).select("-password");
    const oldAvatarUrl = user.avatar;

     // Extract the public ID from the old avatar URL
    const oldAvatarPublicId = oldAvatarUrl ? oldAvatarUrl.split('/').pop().split('.')[0] : null;

    user.avatar = avatar.url
    await user.save({ validateBeforeSave: false })

    
    // If there's an old avatar, delete it
    if (oldAvatarPublicId) {
        await deleteFileFromCloudinary(oldAvatarPublicId);
    }

    return res
            .status(200)
            .json(
                new ApiResponse(user, 200, "Avatar has been updated successfully")
            )
})

const updateCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(401, "CoverImage file is missing")
    }

    const coverImage = await uploadOnCLoudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(401, "Error while uploading the files in cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set: {
                coverImage: coverImage.url
        } },
        { new: true }
    ).select("-password")

    return res
            .status(200)
            .json(
                new ApiResponse(user, 200, "coverImage has been updated successfully")
            )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const { username } = req.params;

    if (!username.trim()) {
        throw new ApiError(402, "username is missing")
    }

const channel = await User.aggregate([
        {
            $match: {
                username : username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedTO:{
                    $size : "$subscribedTo"
                },
                isSubscribed: {
                    if: {$in: [req.user?._id, "$subscribers.subscribers"]},
                    then: true,
                    else : false
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedTO: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,

            }
        }
    ])

    console.log(channel);
    
    if (!channel?.length) {
        throw new ApiError(404, "Channel doesn't exists..")
    }

    return res
            .status(200)
            .json(
                new ApiResponse(channel[0], 201, "USer channel fetched successfully")
            )
})

const getWatchHistory = asyncHandler(async (req, res) => {
        const user = await User.aggregate([
                    {
                        $match: {
                            _id: new mongoose.Types.ObjectId(req.user._id)
                        }
                    },
                    {
                        $lookup: {
                            from: "videos",
                            localField: "watchHistory",
                            foreignField: "_id",
                            as: "watchHistory",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "owner",
                                        foreignField: "_id",
                                        as: "owner",
                                        pipeline: [
                                            {
                                                $project: {
                                                    fullName: 1,
                                                    username: 1,
                                                    avatar: 1
                                                }
                                            },
                                            {
                                                $addFields: {
                                                    owner: {
                                                        $first: "$owner"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
    ]);
        return res
                .status(200)
                .json(
                    new ApiResponse(user[0].watchHistory, 200, "Watched history fetched successfully")
                );
});

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateAccountDetails,
    updateAvatarFile,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}