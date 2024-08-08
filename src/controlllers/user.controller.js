import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, username, email, password } = req.body;

  console.log("Email : ", email);

  if (
    [fullname, username, email, password].some((filed) => filed?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  const userExisted = User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExisted) {
    throw new ApiError(409, " Email or Username already registered");
  }
});

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if (!avatarLocalPath) {
  throw new ApiError(409, "Avatar is missing");
}

const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if (!avatar) {
  throw new ApiError(409, "Avatar is missing");
}

const user = await User.create({
  fullname,
  email,
  password,
  username: username.toLowerCase(),
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
});

const userCreated = User.findOne(user._id).select("-password -refreshToken");
if (!userCreated) {
  throw new ApiError(500, "Server Error");
}
return res
  .status(201)
  .json(new ApiResponse(200, userCreated, "User Registered "));
export { registerUser };
