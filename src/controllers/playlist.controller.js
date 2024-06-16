import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { Video } from "../models/video.Models.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!(name || description) || (name.trim() === "" || description.trim() === "")) throw new ApiError(401, "Name and description are required");

    const user = await User.findById(req.user?._id);
    if(!user) throw new ApiError(403, "Unauthorized request or user not found");

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })
    if(!playlist) throw new ApiError(500, "Error while creating the playlist");

    return res.status(200).json(
        new ApiResponse(
            playlist,
            201,
            "Playlist created successfully"
        )
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)) throw new ApiError(403, "Invalid user Id");
    
    const user = await User.findById(userId);
    if(!user) throw new ApiError(401, "User not found");

    const playlist = await Playlist.findOne({ owner: userId });
    if(!playlist) throw new ApiError(401, "Playlist not found");

    await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {

        }
    ])


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) throw new ApiError(401, "Invalid playlist id");

    const user = await User.findById(req.user?._id);
    if(!user) throw new ApiError(401, "User not found");
    
    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new ApiError(401, "Playlist not found");

    const playlistAggregate = await Playlist.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: { deleted: { $ne: true } }
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
                                        fullname: 1,
                                        avatar: "$avatar.url",
                                        _id: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            videoOwner: {
                                $first: "$owner"
                            }
                        }
                    },
                    {
                        $project: {
                            owner: 0
                        }
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
                    }
                ]
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
                            fullName: 1,
                            _id: 1,
                            avatar: "$avatar.url",
                            username: 1
                        },
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);

    if(!playlistAggregate) throw new ApiError(401, "Error in aggregation");

    const isEmpty = playlistAggregate.length === 0

    return res.status(200).json(
        new ApiResponse(
            playlistAggregate,
            201,
            isEmpty ? `No video found in the playlist ${req.user?.username}` : `Here is your playlist ${req.user?.username}` 
        )
    )




})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(401, "Invalid video and playlist Id");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new ApiError(401, "Playlist not found");

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(401, "video not found");

    const user = await User.findById(req.user?._id);
    if(!user) throw new ApiError(401, "User not found");

    const addVideoToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                videos: videoId
            }
        },
        {
            new: true
        }
    );

    if(!addVideoToPlaylist) throw new ApiError(401, "Playlist not updated");

    return res.status(200).json(
        new ApiResponse(
            addVideoToPlaylist,
            201,
            "Video added to the playlist"
        )
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(401, "Invalid playlist Id or video Id");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new ApiError(401, "Playlist not found");

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(401, "video not found");

    const user = await User.findById(req.user?._id);
    if(!user) throw new ApiError(401, "User not found");

    const videoExistInPlaylist = await Playlist.findOne({
        videos: videoId,
        _id: playlistId
    })

    if(!videoExistInPlaylist) throw new ApiError(401, "Video doesn't exits in the playlist");

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        }, 
        {
            new: true
        }
    )

    if(!updatePlaylist) throw new ApiError(401, "Video not removed");

    return res.status(200).json(
        new ApiResponse(
            updatePlaylist,
            200,
            `Video ${videoId} has been removed from the playlist ${playlistId}`
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) throw new ApiError(401, "Invalid playlistId");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new ApiError(401, "Playlist not found");

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)
    if(!deletePlaylist) throw new ApiError(401, "Playlist not deleted");

    return res.status(200).json(
        new ApiResponse(
            deletePlaylist,
            201,
            `Playlist ${playlistId} has been deleted successfully`
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {name, description} = req.body;
    if(!(name || description) || (name.trim() === "" || description.trim() === "")) throw new ApiError(401, "Name and descirption field are required");

    if(!isValidObjectId(playlistId)) throw new ApiError(401, "Invalid playlist id");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new ApiError(401, "Playlist not found");

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        },
        { new: true }
    )
    if(!updatedPlaylist) throw new ApiError(401, "Playlist not updated");

    return res.status(200).json(
        new ApiResponse(
            updatedPlaylist,
            201,
            `Playlist has been update with title: "${name}" && description: "${description}"`
        )
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
