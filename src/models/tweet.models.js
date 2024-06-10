import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required:true
    },
    comments:[{ 
        type: mongoose.Types.ObjectId,
        ref: 'Comment'
    }]
}, { timestamps: true });

export const Tweet = mongoose.model("Tweet", tweetSchema);