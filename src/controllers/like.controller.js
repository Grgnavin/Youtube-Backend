import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import { Tweet } from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.Models.js"
import { Comment } from "../models/comment.models.js"

const toggleLike = async(Model, resourceId, userId) => {
    if(!isValidObjectId(resourceId)) throw new ApiError(402, "Invalid resource Id");
    if(!isValidObjectId(userId)) throw new ApiError(402, "Invalid user Id");

    const resource = await Model.findById(resourceId);
    if(!resource) throw new ApiError(402, "Resource not found");

    const resourceField = Model.modelName.toLowerCase();

    const isLiked = await Like.findOne({ [ resourceField ]: resourceId, likedBy: userId });

    let response;
    try {
        response = isLiked
                    ? await Like.deleteOne({ [ resourceField ]: resourceId, likedBy: userId })
                    : await Like.create({ [ resourceField ]: resourceId, likedBy: userId })
    } catch (error) {
        console.error("Tooglike error: ", error);
        throw new ApiError(500, error.message || "Internal server error" )
    }

    const totalLikes = await Like.countDocuments({ [ resourceField ]: resourceId });
    return { totalLikes, isLiked, response }
}  

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const { response, isLiked, totalLikes } = await toggleLike(Video, videoId, req.user?._id);
    return res.status(200).json(
        new ApiResponse(
            { response, totalLikes },
            201, 
            isLiked === null ? `${req.user?.username} has liked this video` : "Remove like successfully"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const { response, isLiked, totalLikes } = await toggleLike(Comment, commentId, req.user?._id);
    return res.status(200).json(
        new ApiResponse(
            { response, totalLikes },
            201, 
            isLiked === null ? `${req.user?.username} has liked this comment` : "Remove like successfully" 
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const { response, isLiked, totalLikes } = await toggleLike(Tweet, tweetId, req.user?._id);
    return res.status(200).json(
        new ApiResponse(
            { response, totalLikes },
            201, 
            isLiked === null ? `${req.user?.username} has liked this tweet` : "Remove like successfully"
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    if(!req.user?._id) throw new ApiError(403, "Unauthorized request");
    const userId = req.user?._id;

    const likedVideos = await Like.aggregate( [
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
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
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                    {
                        $addFields: {
                            videoFile: "$videoFile.url"
                        },
                    },
                    {
                        $addFields: {
                            thumbnail: "$thumbnail.url"
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$video"
        },
        {
            $replaceRoot: {
                newRoot: "$video",
            },
        },
    ])

    console.log(likedVideos);
    return res.status(200).json(
        new ApiResponse(
            likedVideos,
            201,
            likedVideos.length === 0 ? `${req.user?.username} hasn't liked any videos yet` 
            : `${req.user?.username} has liked ${likedVideos.length} videos`
        )
    )



})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}