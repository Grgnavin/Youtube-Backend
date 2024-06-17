import mongoose from "mongoose"
import {Video} from "../models/video.Models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    if(!req.user?._id) throw new ApiError(403, "Unauthorized request");
    const userID = req.user?._id;

    const Stats = await Video.aggregate([
        { // match videos own by the user
            $match : { 
                owner: new mongoose.Types.ObjectId(userID)
            }
        },
        { // look how much subscriber the user has 
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "subscriber",
                as: "subscribers"
            }
        },
        { // look how much tweets the user has 
            $lookup: {
                from: "tweets",
                localField: "owner",
                foreignField: "owner",
                as: "tweets"
            }
        },
        { // look how much subscriptions the user has done 
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribedChannels"
            }
        },
        { // look how much like user has got by the user's video 
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likeCount"
            }
        },
        { // look how much comments the has got by the user's video 
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
         // Group to calculate stats
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                subscribers: { $first: "$subscriber" },
                subscribedTo: { $first: "$subscribedTo" },
                totalLikesOnVideo: {
                    $sum: { $cond: [{ $isArray: "$likeCount" }, { $size: "$likeCount" }, 0] }
                },
                totalTweets: {
                    $sum: { $cond: [{ $isArray: "$tweets" }, { $size: "$tweets" }, 0] }
                },
                totalComments: {
                    $sum: { $cond: [{ $isArray: "$comments" }, { $size: "$comments" }, 0] }
                }
            }
        },
        // {
        //     $project: {
        //         _id: 0,
        //         totalVideos: 1,
        //         totalLikes: 1,
        //         totalComments: 1,
        //         totalTweets: 1,
        //         subscribers: { $size: "$subscribers" },
        //         subscribedTo: { $size: "$subscribedChannels" },
        //     }
        // }
    ]);
//     const uservideo = await Video.findOne({ owner: userID });
//     let withoutVideoStats;
//     if(!uservideo) {
//         withoutVideoStats = await Tweet.aggregate([
//             { //match the tweets own by the user
//                 $match: {
//                     owner: new mongoose.Types.ObjectId(userID)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "subscriptions",
//                     localField: "owner",
//                     foreignField: "channel",
//                     as: "subscribers"
//                 }
//             },
//             { // look how much comments the has got by the user's video 
//                 $lookup: {
//                     from: "comments",
//                     localField: "_id",
//                     foreignField: "video",
//                     as: "comments"
//                 }
//             },
//             { // look how much subscriptions the user has done 
//                 $lookup: {
//                     from: "subscriptions",
//                     localField: "owner",
//                     foreignField: "channel",
//                     as: "subscribedChannels"
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$owner",
//                     totalTweets: { $sum: 1 },
//                     totalComments: { $sum: { $size: "$comments" } },
//                     subscribers: { $sum: { $size: "$subscribers" } },
//                     subscribedTo: { $sum: { $size: "$subscribedChannels" } },
//                 }
//             }
//         ])
//     }
// console.log(withoutVideoStats);
// console.log(Stats);

    // const userHasVideos = await Video.exists({ owner: userID });
    // let channelStats;
    // if(userHasVideos){
    //     channelStats = await  Video.aggregate([
    //                 { // match videos own by the user
    //                     $match : { 
    //                         owner: new mongoose.Types.ObjectId(userID)
    //                     }
    //                 },
    //                 { // look how much subscriber the user has 
    //                     $lookup: {
    //                         from: "subscriptions",
    //                         localField: "owner",
    //                         foreignField: "subscriber",
    //                         as: "subscribers"
    //                     }
    //                 },
    //                 { // look how much tweets the user has 
    //                     $lookup: {
    //                         from: "tweets",
    //                         localField: "owner",
    //                         foreignField: "owner",
    //                         as: "tweets"
    //                     }
    //                 },
    //                 { // look how much subscriptions the user has done 
    //                     $lookup: {
    //                         from: "subscriptions",
    //                         localField: "owner",
    //                         foreignField: "channel",
    //                         as: "subscribedChannels"
    //                     }
    //                 },
    //                 { // look how much like user has got by the user's video 
    //                     $lookup: {
    //                         from: "likes",
    //                         localField: "_id",
    //                         foreignField: "video",
    //                         as: "likeCount"
    //                     }
    //                 },
    //                 { // look how much comments the has got by the user's video 
    //                     $lookup: {
    //                         from: "comments",
    //                         localField: "_id",
    //                         foreignField: "video",
    //                         as: "comments"
    //                     }
    //                 },
    //                  // Group to calculate stats
    //                 {
    //                     $group: {
    //                         _id: null,
    //                         totalVideos: { $sum: 1 },
    //                         totalViews: { $sum: "$views" },
    //                         subscribers: { $first: "$subscriber" },
    //                         subscribedTo: { $first: "$subscribedTo" },
    //                         totalLikesOnVideo: {
    //                             $sum: { $cond: [{ $isArray: "$likeCount" }, { $size: "$likeCount" }, 0] }
    //                         },
    //                         totalTweets: {
    //                             $sum: { $cond: [{ $isArray: "$tweets" }, { $size: "$tweets" }, 0] }
    //                         },
    //                         totalComments: {
    //                             $sum: { $cond: [{ $isArray: "$comments" }, { $size: "$comments" }, 0] }
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $project: {
    //                         _id: 0,
    //                         totalVideos: 1,
    //                         totalLikes: 1,
    //                         totalComments: 1,
    //                         totalTweets: 1,
    //                         subscribers: { $size: "$subscribers" },
    //                         subscribedTo: { $size: "$subscribedChannels" },
    //                     }
    //                 }
    //     ])
    //     console.log("Stats with videos:", channelStats);
    // }else {
    //     channelStats = await Tweet.aggregate([
    //                     { //match the tweets own by the user
    //                         $match: {
    //                             owner: (userID)
    //                         }
    //                     },
    //                     {
    //                         $lookup: {
    //                             from: "subscriptions",
    //                             localField: "owner",
    //                             foreignField: "channel",
    //                             as: "subscribers"
    //                         }
    //                     },
    //                     { // look how much comments the has got by the user's video 
    //                         $lookup: {
    //                             from: "comments",
    //                             localField: "_id",
    //                             foreignField: "tweet",
    //                             as: "tweetComments"
    //                         }
    //                     },
    //                     { // look how much subscriptions the user has done 
    //                         $lookup: {
    //                             from: "subscriptions",
    //                             localField: "owner",
    //                             foreignField: "channel",
    //                             as: "subscribedChannels"
    //                         }
    //                     },
    //                     {
    //                         $group: {
    //                             _id: null,
    //                             totalTweets: { $sum: 1 },
    //                             totalComments: { $sum: { $size: "$comments" } },
    //                             subscribers: { $sum: { $size: "$subscribers" } },
    //                             subscribedTo: { $sum: { $size: "$subscribedChannels" } },
    //                         }
    //                     }
    //                 ])
    //                 console.log("Stats with videos:", channelStats);
    // }
    console.log(Stats);

    return res.status(200).json(
        new ApiResponse(
            Stats,
            201,
            `Here is all the channel stats of ${req.user?.username}`
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    if(!req.user?._id) throw new ApiError(403, "Unauthorized request");
    const userId = req.user?._id;
    try {
        const userVideos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
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
                                fullname: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$owner"
            },
            {
                $addFields: {
                    videoFile: "$videoFile.url"
                }
            },
            {
                $addFields: {
                    thumbnail: "$thumbnail.url"
                }
            },
            {
                $addFields: {
                    owner: "$owner.username"
                }
            },
        ])
        // console.log(userVideos);
        return res.status(200).json(
            new ApiResponse(
                userVideos,
                201,
                userVideos.length === 0 ? `${req.user?.username} has no videos` : `${req.user?.username} has ${userVideos.length} videos` 
            )
        )
    } catch (error) {
        throw new ApiError(500, "Internal server error: ", error);
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }