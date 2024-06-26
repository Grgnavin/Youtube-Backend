import { Router } from 'express';
import {
    getSubscribedChannels,
    toggleSubscription,
    getChannelSubscribers
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .post(toggleSubscription);

router.route("/user/:channelId").get(getChannelSubscribers);
router.route("/s/:subscriberId").get(getSubscribedChannels);
export default router