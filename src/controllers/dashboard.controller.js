import mongoose from "mongoose"
import {Video} from "../models/video.Models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    if(!req.user?._id) throw new ApiError(403, "Unauthorized request");
    
    const usersVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: "$avatar.url",
                            fullname: 1
                        }
                    }
                ]
            }
        },

    ])
    console.log(usersVideos);
    
    return res.status(200).json(
        new ApiResponse(
            usersVideos,
            201,
            `${req.user?.username} has ${usersVideos.length} videos`
        )
    )

})

export {
    getChannelStats, 
    getChannelVideos
    }