import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.Models.js"
import {User} from "../models/user.models.js"
import {Comment} from "../models/comment.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { deleteFileFromCloudinary, uploadOnCLoudinary } from "../utils/cloudinary.js"
import { Playlist } from "../models/playlist.models.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query= "", sortBy="createdAt", sortType=1, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const { channelId } = req.params;
    if(!isValidObjectId(channelId)) throw new ApiError(403, "Invalid channelId");

    

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;
        if(!(title || description) || !(title?.trim() && description.trim())) throw new ApiError(401, "Please provide title and description")
        
        const user = await User.findById(req.user?._id);
        if(!user) throw new ApiError(403, "Unauthorized request");
        
        if (!req.files?.video?.[0].path && !req.files?.thumbnail?.[0].path) throw new ApiError(402, "Videofile and thumbnail is required")
        
        let videoFile ;
        let thumbnailFile;
        try {
            console.log(req.files);
        //upload the file on the cloudinary concurrently
        videoFile = await uploadOnCLoudinary(req.files?.video?.[0].path);
        thumbnailFile = await uploadOnCLoudinary(req.files?.thumbnail?.[0].path);
        // console.log("Thumbnail file: ", thumbnailFile);
        // console.log("Video file: ", videoFile);
        const videoDuration = videoFile?.duration || 0;
        const video = await Video.create({
            videoFile:  { publicId: videoFile?.public_id, url: videoFile?.url } ,
            thumbnail: { publicId: thumbnailFile?.public_id, url: thumbnailFile?.url },
            title,
            description,
            owner: req.user?._id,
            isPublished: true,
            duration: videoDuration
        })
        user.video.push(video._id);
        user.save({ validateBeforeSave: false });
        res.status(201).json(
            new ApiResponse({
                videofile: videoFile.url, //only sending the url of the video
                thumbanilFile: thumbnailFile.url, //only sending the url of the video
            }, 201, `${req.user?.username} has uploaded video successfully`)
        )

    } catch (error) {
        console.error("Error occurred during video upload process: ", error);

        // Log detailed validation errors if present
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error: ${error.errors[key].message}`);
            });
        }

        try {
            //delete the uploaded file if an error occurs
            if(videoFile?.url) await deleteFileFromCloudinary(videoFile?.url, videoFile?.public_id);
            if (thumbnailFile?.url) await deleteFileFromCloudinary(thumbnailFile?.url, thumbnailFile?.public_id);
            console.log("uploaded files deleted successfully");
            return res.json(
                new ApiResponse(
                    {},
                    201,
                    "Already posted so deleted"
                )
            )
        } catch (error) {
                console.error("Error while deleting video: ", error);
                throw new ApiError(500, error?.message || 'Server Error while deleting video from cloudinary');
        }
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)) throw new ApiError(403, "Invalid videoId")
    
    try {
        const video = await Video.findById(videoId);
        if(!video) throw new ApiError(403, "Video not found");

        const user = await User.findById(req.user?._id, { watchHistory: 1 });
        if(!user) throw new ApiError(403, "User not found");
        
        if (!user.watchHistory.includes(videoId)) {
            await Video.findByIdAndUpdate(
                videoId,
                {
                    $inc: { views: 1 }
                },
                {
                    new: true
                }
            )
        }
        await User.findByIdAndUpdate(
            user._id,
            {
                $addToSet: { watchHistory: videoId }
            }
        )

        const videoAggregate = await Video.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(videoId) }
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
                                avatar: "$avatar.url",
                            }
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
            },
            {
                $addFields: {
                    videofile: "$videoFile.url"
                }
            },
            {
                $addFields: {
                    thumbnail: "$thumbnail.url"
                }
            }
        ])
        console.log("video: ", videoAggregate[0]);
        if(!videoAggregate) throw new ApiError(500, "Video detail not found and error in aggregation");
        
        return res.status(201).json(
            new ApiResponse(
                videoAggregate[0],
                200,
                "video fetched successfully"
            )
        )
    } catch (error) {
        console.error("Error in aggregation: ", error);
        throw new ApiError(500, error.message || "Error in aggregation")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // update video details like title, description, thumbnail
    const{ title, description } = req.body;
    const thumbnailFilePath = req.files?.path;

    if(!isValidObjectId(videoId)) throw new ApiError("Invalid video Id");
     // Check if all required fields are provided
    if(
        !thumbnailFilePath  ||
        (!title || title.trim() === '') || 
        (!description || description.trim() === ''))
        throw new ApiError(401, "Update fields are required");
        
        // Retrieve the existing video details
        const oldVideo = await Video.findById(
            videoId,
            { thumbnail:1, owner: 1 }
        )
        if(!oldVideo) throw new ApiError(402, "Video not found");

     // Check if the logged-in user is the owner of the video
    if(!oldVideo?.owner.toString() !== req.user?._id.toString()) throw new ApiError(403, "Unauthorized request");
    
    //upload the file to cloudinary
    const uploadThumbnail = await uploadOnCLoudinary(thumbnailFilePath );
    if(!uploadThumbnail) throw new ApiError(500, "Error while uploading the thumbnail");
    //update the thumbnail,title,description of the video
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    url: uploadThumbnail?.url,
                    publicId: uploadThumbnail?.public_id
                }
            }
        },{
            new: true
        }
    )
    if(!updatedVideo){
        // Clean up the newly uploaded thumbnail if the update fails
        await deleteFileFromCloudinary(uploadThumbnail?.url, uploadThumbnail?.public_id);
        console.error("Video not updated successfully");
        throw new ApiError(402, "Uploaded video not uploaded in database");
    }

    // Delete the old thumbnail from Cloudinary
    if (oldVideo.thumbnail.url) {
        try {
            await deleteFileFromCloudinary(oldVideo.thumbnail?.url, oldVideo.thumbnail?.publicId);
        } catch (error) {
            console.error("Error while deleting the old video url", error);
        throw new ApiError(500, "Error while deleting the old video url");
        }
    }
    return res.status(200).json(
        new ApiResponse(
            updatedVideo,
            201,
            `${req.user.username}, the video has been updated successfully`
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(401, "Invalid video Id");
    
    //check if the loggedin user is the owner of the video
    
    const video = await Video.findById(videoId).select('_id videoFile thumbnail owner');
    if(!video) throw new ApiError(403, "Video not found")
    
    if(video?.owner?.toString() !== req.user?._id.toString()) throw new ApiError(403, "Unauthorized request");
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        //delete video from cloudinary first
        const deleteVideoFile = await deleteFileFromCloudinary(video.videoFile?.publicId, video.videoFile?.url);
        const deleteThumbnailFile = await deleteFileFromCloudinary(video.thumbnail?.publicId, video.thumbnail?.url);
        
        if(!deleteVideoFile || !deleteThumbnailFile) throw new ApiError(402, "Error while deleting the files from cloudinary")
        
        //delete video from db then 
        await Video.findByIdAndDelete(videoId);

        //Remove video from all the collections;
        const deleteComment = await Comment.deleteMany({ video: videoId });
        const deleteLike = await Like.deleteMany({ video: videoId });
        const deleteFromUser = await User.updateMany({ watchHistory: videoId }, { $pull: videoId });
        const deleteFromPlaylist = await Playlist.deleteOne({ videos: videoId });
        
        if(!deleteComment || !deleteLike || !deleteFromUser || deleteFromPlaylist) throw new ApiError(401, "Error while updating from the other collections");

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(
                {},
                201,
                "Video deleted successfully"
            )
        )
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error in server: ", error)
        throw new ApiError(500, error.message || "Internal Server error");
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(401, "Invalid video Id");

    const video = await Video.findById(videoId, { isPublished: 1, owner: 1 });
    if(!video) throw new ApiError(401, "Video not found");

    if(video?.owner.toString() !== req.user?._id.toString()) throw new ApiError(403, "Unauthorized request");

    const togglepublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },{
            new: true
        }
    )

    if(!togglepublish) throw new ApiError(402, "Error while toggling the video");

    return res.status(201).json(
        new ApiResponse(
            togglepublish,
            200,
            togglepublish.isPublished ? "Published successfully" : "UnPublished successfully"
        )
    )

})

const getAllVideosForFeed = asyncHandler(async(req,res) => {
    if(!req.user._id) throw new ApiError(402, "Unauthorized Request")

    const allVideos =await Video.find();
    if(!allVideos) throw new ApiError(401, "Error while fetching the videos");

    if(allVideos.length === 0 || allVideos === null) {
        return res.status(200).json(
            new ApiResponse(
                null,
                201,
                "No videos to show"
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            allVideos,
            201,
            "All videos fetched successfully"
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideosForFeed
}
