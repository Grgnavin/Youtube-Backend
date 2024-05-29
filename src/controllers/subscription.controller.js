import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription, Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId, subscriberId } = req.params
    // TODO: toggle subscription
    try {
        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId
        })
        //if the subscription exists 
        if(existingSubscription){
            await Subscription.findByIdAndDelete(existingSubscription._id);
            return res.json({
                success: true, 
                message: "Unsubscribed sucessfully"
            })
        }
        //if subscription doesn't exists do subscribe
        await Subscription.create({ subscriber: subscriberId, channel: channelId })
        return res.json(
            new ApiResponse({}, 201, "Subscribed Successfully")
        )
    } catch (error) {
        throw new ApiError(402, "Error toggling the subscription")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(402, "Channel id is required")
    }
    try {
        //first find all the coresponding suscriptions that the channel get
        const subscriptions = await Subscription.find({ channel: channelId });
        if (subscriptions.length === 0) {
            return res.json(
                new ApiResponse([], 200, "No subscribers for this channel")
            );
        }
        //extract the user id from the document
        const subscriberIDs = subscriptions.map(subscription => subscription.subscriber);
        //find user corresponding to subscriber IDs
        const subscribers = await User.find({ _id: { $in: subscriberIDs } });
        return res.json(
            new ApiResponse(subscribers, 201, `${subscribers.length} has suscribed to this channel`)
        )
    } catch (error) {
        throw new ApiError(403, "Error while getting the subscriber of channel")
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