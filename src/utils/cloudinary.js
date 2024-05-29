import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
import { ApiError } from './ApiError.js';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCLoudinary = async (filepath) => {
    try {
        if(!filepath) return null;
        //upload the file to cloudinary
        const response = await cloudinary.uploader.upload(filepath, {
            resource_type: "auto"
        })
        //file has been uploaded sucessfully 
        // console.log("File is uploaded on cloudinary: ", response.url);
        fs.unlinkSync(filepath)
        return response;
    } catch (error) {
        fs.unlinkSync(filepath)  //remove the locally saved temporary file as the operation got failed
        return null
}
}

const deleteFileFromCloudinary = async(publicId) => {
    try {
        const response = cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        throw new ApiError(500, "Error while deleting file from cloudinary")
    }
}


export { 
    uploadOnCLoudinary,
    deleteFileFromCloudinary
}
