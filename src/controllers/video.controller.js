import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.Models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCLoudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description.length >= 1) {
        throw new ApiError(402, "Title and description is required")
    }
    const videoFile = req.files?.video[0];
    const thumbanilFile = req.files?.thumbnail[0];

    if (!videoFile || !thumbanilFile) {
        throw new ApiError(402, "Videofile and thumbnail is required")
    }
    
    try {
        const uploadVideoResponse = await uploadOnCLoudinary(videoFile);
        const uploadThumbailResponse = await uploadOnCLoudinary(thumbanilFile);

        if (!uploadVideoResponse|| !uploadThumbailResponse) {
            throw new ApiError(402, "Error while uploading the video") 
        }

        const uploadedVideo = await Video.create({
            videoFile: uploadVideoResponse.url,
            thumbnail: uploadThumbailResponse.url,
            title,
            description,
            owner: req.user.username,
            isPublished: true,
            duration: videoDuration
        })

        res.status(201).json(
            new ApiResponse(uploadedVideo, 201, "Video uploaded successfully")
        )

    } catch (error) {
        throw new ApiError(403, "Error while uploading the video")
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
