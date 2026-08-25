import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    async(req,res)=>{
        //get user details from frontend
        //validation - not empty
        //check if user already exists: username, email
        //check for images, check for avatar
        //upload them to cloudinary, avatar
        //create user object - create entry in db
        //remove password and refresh token field forn response
        //check for user creation
        //return response

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
        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;
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
        secure:true
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
        $set:{
            refreshToken:undefined
        }
    },
    {
        new :true
    }
   )
   const options={
       httpOnly:true,
       secure:true
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged Out"))
})
export  {registerUser,loginUser,logoutUser};