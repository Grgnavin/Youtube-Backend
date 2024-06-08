import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if (!content || content.trim().length === 0) throw new ApiError(402, "Content can't be empty")

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    try {
        const tweet = await Tweet.create({
                content : content,
                owner : req.user?._id
            })

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

    if (!userId) throw new ApiError(402, "UserId is required");

    if(!isValidObjectId(userId)) throw new ApiError(404, "UserId not valid");

    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(403, "User not found")
        }
    // Convert the tweet IDs to ObjectId if they are not already
    const tweetIds = user.tweets.map(id => new mongoose.Types.ObjectId(id));

    // Fetch all tweets associated with this user
    const tweet = await Tweet.find({ _id: { $in: tweetIds } });
        return res
                .status(201)
                .json(
                    new ApiResponse(tweet, 201, `Here are all the tweets of the ${user.username}`)
                )

    } catch (error) {
        console.log("error: ", error);
        throw new ApiError(401, "Unauthorized request or tweet doesn't exists")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
     //TODO: update tweet
        const { newContent } = req.body;
        const { tweetId } = req.params;
    
        if (!newContent || newContent.trim().length === 0) throw new ApiError(400, "User ID is required");
    
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet Id");
        }
        
        try {
            const user = await User.findById(req.user?._id);
            if (!user) {
                throw new ApiError(400, "User not found");
            }
            
            if (!user.tweets.includes(tweetId)) {
                throw new ApiError(400, "Tweet not found");
            }
            const tweet = await Tweet.findById(tweetId);
            
            tweet.content = newContent
            await tweet.save({ validateBeforeSave: false })
            
            return res
                    .status(201)
                    .json(
                        new ApiResponse(tweet.content , 201, "Tweet updated successfully")
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
        // const findUser = await User.findById(req.user.id);
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

        const user = await User.findById(req.user._id);

        if (!user.tweets?.includes(tweetId)) {
            throw new ApiError(401, `This tweet is not found in the ${user.username}'s model`)
        }
        // Remove the tweet from the user's tweet array
        await User.updateOne(
            { _id: user._id },
            { $pull: { tweets: new mongoose.Types.ObjectId(tweetId) } }
        );

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
        console.log(error);
        throw new ApiError(402, "Error while deleting the tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
