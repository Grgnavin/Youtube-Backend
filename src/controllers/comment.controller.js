import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"

const getTweetComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {tweetId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!isValidObjectId(tweetId)) throw new ApiError(401, "Invalid tweet id");

    const tweet = await Tweet.findById(tweetId);
    if(!tweet) throw new ApiError(401, "Tweet not found");

    let commentAggregate;
    try {
        commentAggregate = await Comment.aggregate([
            { //stage 1 getting all the comments of a tweet using tweet id
                $match:  { tweetId: new mongoose.Types.ObjectId(tweetId) }
            },
            {//stage 2 getting user info from the users collection
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
                    owner: {
                        $arrayElemAt: ["$owner", 0] 
                    }
                }
            },{
            $sort: {
                "createdAt": -1
            }
        },
        { // Skipping the documents for pagination
            $skip: (page - 1) * limit
        },
        { // Limiting the documents for pagination
            $limit: parseInt(limit)
        }
        ])
    } catch (error) {
        console.error("Error in aggregation:", error);
        throw new ApiError(500, error.message || "Internal server error in comment aggregation");
    }
    const options = {
        page,
        limit,
        customLabels: {
            docs: "comments",
            totalDocs: "totalComments",
        },
        limit: parseInt(limit),
    }

    Comment.aggregatePaginate(
        commentAggregate,
        options
    ).then(res => {
        if (res.comments.length === 0) {
            return res.json(
                new ApiResponse(
                    [],
                    201,
                    "No comments found"
                )
            )
        }
        return res.status(201).json(
            new ApiResponse(
                res,
                201,
                "Comments retrieve successfully"
            )
        )
    }).catch((err) => {
        console.error("Error in aggregation: ", err);
        return res.status(201).json(
            new ApiError(
                [],
                201,
                "Error retrieving comments"
            )
        )
    })
})

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
