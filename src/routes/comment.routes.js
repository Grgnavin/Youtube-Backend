import { Router } from 'express';
import {
    addComment,
    addVideoComment,
    deleteComment,
    getTweetComments,
    updateComment,
    getVideoComments
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/t/:tweetId").get(getTweetComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
router.route("/v/:videoId").post(addVideoComment).get(getVideoComments);

export default router