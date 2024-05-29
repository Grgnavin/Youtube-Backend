import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthCheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const { bloodPressure, healthStatus } = req.body;

    if (bloodPressure !== "70/110" || healthStatus !== "healthy") {
        throw new ApiError(402, "Sorry you are sick and need a checkup")
    }
    return res.status(200).json(
        new ApiResponse({}, 201, "Congatulation uh are healthy asf")
    )
})

export {
    healthCheck
    }