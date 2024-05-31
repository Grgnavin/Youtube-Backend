import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    likeCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Tweet = mongoose.model("Tweet", tweetSchema);