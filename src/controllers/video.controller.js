import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.Models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { deleteFileFromCloudinary, uploadOnCLoudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
        if(!(title || description) || !(title?.trim() && description.trim())) throw new ApiError(401, "Please provide title and description")
        
        if (!req.files?.video?.[0].path && !req.files?.thumbnail?.[0].path) throw new ApiError(402, "Videofile and thumbnail is required")
        
        let videoFile ;
        let thumbnailFile;
        try {
        //upload the file on the cloudinary concurrently
        videoFile = await uploadOnCLoudinary(req.files?.video?.[0].path);
        thumbnailFile = await uploadOnCLoudinary(req.files?.thumbnail?.[0].path);
        // console.log("Thumbnail file: ", thumbnailFile);
        await Video.create({
            videoFile: { publicId: videoFile.public_id, url: videoFile?.url },
            thumbnail: { publicId: thumbnailFile.public_id, url: thumbnailFile?.url },
            title,
            description,
            owner: req.user?._id,
            isPublished: true,
            duration: videoDuration
        })

        res.status(201).json(
            new ApiResponse({
                videofile: videoFile.url,
                thumbanilFile: thumbnailFile.url,
            }, 201, "Video uploaded successfully")
        )

    } catch (error) {
        try {
            //delete the uploaded file if an error occurs
            if(videoFile?.url) await deleteFileFromCloudinary(videoFile?.url, videoFile?.public_id);
            if (thumbnailFile?.url) await deleteFileFromCloudinary(thumbnailFile?.url, thumbnailFile?.public_id);
            console.log("Success");
            return res.json(
                new ApiResponse(
                    {},
                    201,
                    "Sucessfully uploaded"
                )
            )
        } catch (error) {
                console.error("Error while deleting video: ", error);
                throw new ApiError(500, error?.message || 'Server Error while deleting video from cloudinary');
        }
            console.error("Error while publishing video : ", error);
            throw new ApiError(500, error?.message || 'Server Error while uploading video');
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
