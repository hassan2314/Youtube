import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const genrateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(502, "Server Error");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    // Get user details from the request body
    const { fullname, username, email, password } = req.body;

    console.log("Email:", email);

    // Validate that all fields are present and not empty
    if (
      [fullname, username, email, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists by username or email
    const userExisted = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (userExisted) {
      throw new ApiError(409, "Email or Username already registered");
    }

    // Get paths for avatar and cover image if provided
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;

    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
      throw new ApiError(409, "Avatar is missing");
    }

    // Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      throw new ApiError(409, "Avatar upload failed");
    }

    // Create the user in the database
    const user = await User.create({
      fullname,
      email,
      password,
      username: username.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    // Retrieve the created user without sensitive information
    const userCreated = await User.findOne({ _id: user._id }).select(
      "-password -refreshToken"
    );
    if (!userCreated) {
      throw new ApiError(500, "Server Error");
    }

    // Return the response with user data
    return res
      .status(201)
      .json(new ApiResponse(201, userCreated, "User Registered successfully."));
  } catch (error) {
    // Handle any unexpected errors
    next(error);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  //Input password and email/username
  //check username / email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  if (!email || !username) {
    throw new ApiError(401, "Email or Username is Requried");
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const isPaswordValid = await user.isPasswordCorrect(password);

  if (!isPaswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await genrateAccessTokenAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});
export { registerUser, loginUser };
