import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"

const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(tweetId)) {
        return res.status(401).json(new ApiError(401, "Invalid tweet id"));
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        return res.status(401).json(new ApiError(401, "Tweet not found"));
    }

    try {
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            customLabels: {
                docs: "comments",
                totalDocs: "totalComments"
            }
        };

        const aggregate =await Comment.aggregate([
            {
                $match: { tweet: new mongoose.Types.ObjectId(tweetId) }
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
                                _id: 1,
                                username: 1,
                                email: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] }
                }
            },
            {
                $sort: { "createdAt": -1 }
            }
        ]);

        const result = await Comment.aggregatePaginate(aggregate, options);

        console.log("Result: ", result);

        if (result.comments.length === 0) {
            return res.status(200).json(
                new ApiResponse(
                    [], 
                    200, 
                    "No comments found"
                ));
        }

        return res.status(200).json(
            new ApiResponse(
                    result, 
                    200, 
                    "Comments retrieved successfully"
                ));
    } catch (err) {
        console.error("Error in aggregation paginate: ", err);
        return res.status(500).json(new ApiError(500, "Error retrieving comments"));
    }
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a tweet
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweetId");

    const { content } = req.body;
    if (!content) throw new ApiError(400, "Content is required");

    const tweet = await Tweet.findById(tweetId);
    const user = await User.findById(req.user?._id).select("_id username");

    if (!tweet) throw new ApiError(404, "Tweet not found");
    if (!user) throw new ApiError(404, "User not found");

    const comment = await Comment.create({
        content,
        tweet: tweetId,
        owner: user
    });

    if (!comment) throw new ApiError(500, "Something went wrong while adding the comment");

    tweet.comments.push(comment._id);
    await tweet.save({ validateBeforeSave: false });

    return res.status(201).json(
        new ApiResponse(
            comment,
            201,
            `${user.username} has commented on this tweet`
        )
    );
});


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    if(!isValidObjectId(commentId)) throw new ApiError(401, "Invalid comment Id");

    const { content } = req.body
    if(!content || content?.trim() === "") throw new ApiError(401, "Content is required");

    try {
        const comment = await Comment.findById(commentId);
        if(!comment) throw new ApiError(401, "Comment not found");
        
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {
                    content
                }
            },
            {
                new: true
            }
        )
        if(!updatedComment) throw new ApiError(401, "Error while updating the comment");
        return res.status(201).json(
            new ApiResponse(
                updatedComment.content,
                200,
                "Comment has been updated"
            )
        )
    } catch (error) {
        console.error("Error while updating the comment:", error);
        throw new ApiError(401, error.message || "Error while updating the comment")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if(!isValidObjectId(commentId)) throw new ApiError(401, "Invalid comment Id");
    
    try {
        const comment = await Comment.findByIdAndDelete(commentId);
        if (!comment) throw new ApiError(404, "Comment not found");

        return res.status(200).json(
            new ApiResponse(
                comment,
                200,
                "Comment deleted successfully"
            )
        );
    } catch (error) {
        console.error("Error while deleting the comment:", error);
        throw new ApiError(500, error.message || "Error while deleting the comment");
    }
})

export {
    getTweetComments, 
    addComment, 
    updateComment,
    deleteComment
}
