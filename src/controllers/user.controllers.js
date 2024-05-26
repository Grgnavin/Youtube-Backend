import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCLoudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async(req, res) =>{
    //get users details from the frontend
    //validation - any field is not empty
    //check if the user already exits by username and email
    //check for avatar and images: if yes upload them in cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from the response
    //check for user creation
    //return response
    const { username, fullName, email, password } = req.body;
    // console.log(req.body);
    // console.log("Email: ", email);

    if (
        [fullName , username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar =await uploadOnCLoudinary(avatarLocalPath);
    const coverImage =await uploadOnCLoudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName  ,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    })

    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registrying the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registred successfully")
    )

})


export { registerUser }