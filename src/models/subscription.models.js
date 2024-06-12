import mongoose, { Schema }  from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : [{
        type: Schema.Types.ObjectId, // the one who suscribes
        ref: 'User'
    }],
    channel: {
        type: Schema.Types.ObjectId, // the one who owns the channel
        ref: 'User'
    }
}, { timestamps: true });

export const Subscription = mongoose.model('Subscription', subscriptionSchema); 