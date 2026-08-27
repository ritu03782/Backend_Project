import { v2 as cloudinary} from 'cloudinary';
import fs from "fs";
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log(
    "CLOUDINARY_API_SECRET exists:",
    !!process.env.CLOUDINARY_API_SECRET
);
cloudinary.config({
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_API_SECRET
 });
const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath)return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("file is uploaded on cloudinary",response.url);
        return response;
    }
    catch(error){
          console.log("Cloudinary Error:", error);
          fs.unlinkSync(localFilePath)
          return null;
    }
}
export {uploadOnCloudinary};
