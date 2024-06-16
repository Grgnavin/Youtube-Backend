import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthCheck = asyncHandler(async (req, res) => {
    const { bloodPressure, healthStatus }  = req.body;

    if (bloodPressure !== "70/110" || healthStatus === "unhealthy") {
        throw new ApiError(402, "You are unhealthy uh need checkup")
    }

    return res 
            .status(201)
            .json(
                new ApiResponse({}, 201, "Congratulation uh are healthy")
            )

})

export {
    healthCheck
}