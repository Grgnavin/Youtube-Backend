import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//returns the list of subscriber to channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)) throw new ApiError(401, "Invalid channel ID");

    if(!req.user?._id) throw new ApiError(401, "User id not found");
    const subscriberId = req.user?._id

    let isSubscribed = await Subscription.findOne({ channel: channelId, subscriber: subscriberId });
    let response;
    try{
    response = isSubscribed 
                ? await Subscription.deleteOne({channel: channelId, subscriber: subscriberId })
                : await Subscription.create({channel: channelId, subscriber: subscriberId })
    } catch (error) {
        throw new ApiError(402, error?.message || "Internal server error in toggleSubscription")
    }

        return res
                .status(201)
                .json(
                    new ApiResponse(
                        response, 
                        201, 
                        isSubscribed? "Unsubscribed sucessfully" : "Subscribed Successfully" 
                    )
                )
    }
)

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) throw new ApiError(401, "Invalid channel id");
    
    const user = await User.findById(req.user?._id)
    if(!user) throw new ApiError(401, "User not found ");
        try{
        const subscribers = await Subscription.aggregate([
            {
                $match: { channel: mongoose.Types.ObjectId(channelId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriber",
                    pipeline: [{
                        $project: {
                            username: 1,
                            email: 1,
                        }
                    }]
                }
            },
            {
                $addFields: {
                    subscriber: { $arrayElemAt: [ "subscriber", 0 ] }
                }
            }
        ])
        if(!subscribers) throw new ApiError(404, "Error in aggregation");

        const subscriberList = subscribers.map(item => item.subscriber);

        return res
                .status(201)
                .json(
                    new ApiResponse(
                        subscriberList,
                        201,
                        `Here are the list of subscriber of ${channelId} channel`
                    )
                )
    } catch (error) {
        throw new ApiError(500, error.message || "Error while getting the subscriber of channel")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
        const { subscriberId } = req.params;

        if (!subscriberId) {
            throw new ApiError(400, "Subscriber ID is required");
        }
        try {
            // 1. Retrieve User's Subscriptions
            const subscriptions = await Subscription.find({ subscriber: subscriberId });
    
            // 2. Extract Channel IDs
            const channelIds = subscriptions.map(subscription => subscription.channel);
    
            // 3. Query Users (who are the channels)
            const channels = await User.find({ _id: { $in: channelIds } });
    
            // 4. Return Channel List
            res.json(new ApiResponse(channels, 200, `User is subscribed to ${channels.length} channels`));
        } catch (error) {
            throw new ApiError(500, "Error while getting the subscribed channels");
        }
    });

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}