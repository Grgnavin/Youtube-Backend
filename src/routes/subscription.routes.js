import { Router } from 'express';
import {
    getSubscribedChannels,
    toggleSubscription,
    getUserChannelSubscribers
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

router.route("/user/:subscriberId").get(getUserChannelSubscribers);

export default router