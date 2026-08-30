import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshToken=async(user_id)=>{
    try{
    const user=await User.findById(user_id);
    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken};
}
    catch(error){
        throw new ApiError(500,"Something went wrong while generating access and refresh token");
    }
}
const registerUser = asyncHandler(
    async(req,res)=>{console.log("Req Body:", req.body);
        //get user details from frontend
        //validation - not empty
        //check if user already exists: username, email
        //check for images, check for avatar
        //upload them to cloudinary, avatar
        //create user object - create entry in db
        //remove password and refresh token field forn response
        //check for user creation
        //return response
       console.log("Req Body:", req.body);
       console.log("Req Files:", req.files);
        const {username, email, fullName, password}=req.body
        if([fullName,email,username,password].some((field)=>field?.trim()==="")){
            throw new ApiError(400,"All field are required");
        }
        const existedUser= await User.findOne({
            $or:[{username}, {email}]
        })
        if(existedUser){
            throw new ApiError(409,"User with email or username already exist")
        }
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is required");
        }
        const avatar=await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!avatar){
             throw new ApiError(400,"Avatar file is required");
        }
        const user = await User.create({
            fullName,
            avatar:avatar.url,
            coverImage:coverImage?.url||"",
            email,
            password,
            username:username.toLowerCase()

        })
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if(!createdUser){
            throw new ApiError(500,"Something went wrong while registering the user")
        }
        return res.status(201).json(
            new ApiResponse(200,createdUser,"User Registered Sucessfully")
        )
    }
)
// login User
const loginUser = asyncHandler(async(req,res)=>{
    //get email and password from frontend
    //check all the required field are given
    //check whether user exist or not
    //if user exist 'YES' check password if exist
    //generate access token and refresh token send ApiResponse User logged in and also cookie
    //else password incorrect
    //else ApiResponse User doesn't exist
    const {username,email,password}=req.body;
    if(!username && !email){
        throw new ApiError(400,"Username or email is required");
    }
    if(!password){
        throw new ApiError(400,"Password is required")
    }
    const user= await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
    const isPasswordValid= await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    user.refreshToken = refreshToken;
    const loggedInUser=user.toObject();
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;
    const options={
        httpOnly:true,
        secure:true,
         path: "/"
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,
                refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(req.user._id,
    {
        $unset:{
            refreshToken:1
        }
    },
    {
        new :true
    }
   )
   const options={
       httpOnly:true,
       secure:true,
        path: "/"
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1. Get incoming token from cookies (plural) or request body
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        // 2. Decode the incoming token using your secret key
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        );

        // 3. Find the user manually since req.user is not set by middleware
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // 4. Match the incoming token against the stored token in DB
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        };

        // 5. Re-generate both tokens (helper saves newRefreshToken to DB internally)
        const { accessToken, refreshToken:newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        // 6. Return response with fresh cookies
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password!! Enter Correct Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"));
});
const updateAccountDetails=asyncHandler(async(req,res)=>{
     const {fullName,email}=req.body;
     if(!fullName || !email){
        throw new ApiError(400,"All fields are required");
     }
     const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
             $set:{
                fullName,
                email
             }
        },
        {new :true}
     ).select("-password");
     return res
     .status(200)
     .json(new ApiResponse(200,user,"Account details updated successfully"))
});
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
       throw new ApiError(400,"Error while uploading on avatar")
    }
    const user=await User.findByIdAndUpdate(req.user._id,
        {
        $set:{
             avatar:avatar.url
           }
        },
        {new:true}).select("-password")
     return res
        .status(200)
        .json(new ApiResponse(200,user,"Avatar updated successfully"))
});
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"CoverImage file is missing");
    }
    const coverImage = await uploadOnCloudinary(avatarLocalPath)
    if(!coverImage.url){
       throw new ApiError(400,"Error while uploading on avatar")
    }
    const user=await User.findByIdAndUpdate(req.user._id,
        {
        $set:{
             coverImage:coverImage.url
           }
        },
        {new:true}).select("-password")
        return res
        .status(200)
        .json(new ApiResponse(200,user,"Cover image updated successfully"))
});

export  {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage};