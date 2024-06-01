import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content, userId } = req.body;

    if (!content || content.trim().length === 0) {
        throw new ApiError(402, "Content field is required or content can't be empty")
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }


    try {
        const tweet = await Tweet.create({
                content : content,
                user: userId
            })
            
        const user = await User.findById(userId)

            if (!user) {
                throw new ApiError(404, "User not found")
            }

            user.tweets.push(tweet._id)
            await user.save({ validateBeforeSave: false })

        return res
                .status(201)
                .json(
                    new ApiResponse(tweet.content, 201, "Tweet created successfully")
                )
    } catch (error) {
        throw new ApiError(402, "Error while creating the tweet")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(402, "UserId is required")
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(403, "User not found")
        }

        const tweet = await Tweet.findById(user.tweets[0]);

        return res
                .status(201)
                .json(
                    new ApiResponse(tweet, 201, `Here are all the tweets of the ${user.username}`)
                )



    } catch (error) {
        
    }

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { newContent, userId } = req.body;

    if (!newContent || newContent.trim().length === 0) {
        throw new ApiError(400, "User ID is required");
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    try {
        const user = await User.findById(userId)
        const tweet = await Tweet.findById(user.tweets[0]);

        user.tweet = newContent
        await user.save({ validateBeforeSave: false })

        tweet.content = newContent
        await tweet.save({ validateBeforeSave: false })

        return res
                .status(201)
                .json(
                    new ApiResponse(user.tweets, 201, "Tweet updated successfully")
                )
    } catch (error) {
        throw new ApiError(402, "Error while updating the tweet")
    }

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    
    if (!tweetId) {
        throw new ApiError(402, "Tweet id is required")
    }

    try {
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
        
        if (!deletedTweet) {
            throw new ApiError(401, "Error while deleting the tweet")
        }

        return res  
                .status(201)
                .json(
                    new ApiResponse({}, 201, "Tweet deleted successfully")
                )
    } catch (error) {
        throw new ApiError(402, "Error while deleting the tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
