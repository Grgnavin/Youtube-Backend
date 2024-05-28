import { Router } from "express";
import { 
        loginUser,
        logoutUser,
        registerUser,
        refreshAccessToken,
        changePassword,
        getUser,
        updateAccountDetails, 
        updateAvatarFile, 
        updateCoverImage, 
        getUserChannelProfile, 
        getWatchHistory 
    } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT ,logoutUser)
router.route('/refresh-Token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT ,changePassword)
router.route('/current-user').post(verifyJWT ,getUser)
router.route('/update-account').patch(verifyJWT ,updateAccountDetails)

router.route('/Avatar').post(verifyJWT , upload.single("avatar"), updateAvatarFile)
router.route('/CoverImage').post(verifyJWT , upload.single("coverImage"), updateCoverImage)

router.route('/channel/:username').post(verifyJWT, getUserChannelProfile)
router.route('/history').get(verifyJWT, getWatchHistory)






export default router;