import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import { Tweet } from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(401, "Tweet id is required")
    }
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        const existingLike = await Like.findOne({ tweet: tweetId ,likedBy: userId });

        if (existingLike) {
            //if the user has already liked it just remove
            await Like.findByIdAndDelete(existingLike._id)
            // decrease the like count by one
            await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCount: -1 } })
            res.status(201).json(
                new ApiResponse({}, 201, "You have already liked the tweet")
            )
        }
        const likedUser =  await Like.create({ tweet: tweetId, likedBy: userId })
        const tweetUpdated = await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCount: 1 } });

        res.json(
            new ApiResponse({ }, 201, `${user.username} has liked the tweet`)
        )

    } catch (error) {
        throw new ApiError(403, "Error while liking the tweet")
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}