import { v2 as cloudinary} from 'cloudinary';
import fs from "fs";
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
        fs.unlinkSync(localFilePath)
        return response;
    }
    catch(error){
          console.log("Cloudinary Error:", error);
          if(fs.existsSync(localFilePath)){
              fs.unlinkSync(localFilePath)
          }
          return null;
    }
}

// Extracts the Cloudinary public_id from a stored asset URL and destroys it.
// Used whenever an avatar is replaced, so the old file doesn't linger in the
// Cloudinary account forever.
const deleteFromCloudinary = async (fileUrl) => {
    try {
        if (!fileUrl) return null;

        const parts = fileUrl.split("/upload/");
        if (parts.length < 2) return null;

        let path = parts[1];              // e.g. v1712345678/avatars/abc123.jpg
        path = path.replace(/^v\d+\//, ""); // strip the version segment
        const publicId = path.substring(0, path.lastIndexOf(".")) || path;

        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.log("Cloudinary delete error:", error);
        return null;
    }
}

export {uploadOnCloudinary, deleteFromCloudinary};
