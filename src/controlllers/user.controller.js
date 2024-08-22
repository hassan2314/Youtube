import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const genrateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
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
  if (!email && !username) {
    throw new ApiError(401, "Email or Username is Requried");
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
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

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(402, "No Refresh Token found");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    console.log("Incomming : ", incomingRefreshToken);
    console.log("Decoded : ", decodedToken);
    console.log("User Token : ", user.refreshToken, user.fullname, user._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const { accessToken, newRefreshToken } =
      await genrateAccessTokenAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});

const currentPasswordChange = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(401, "Fill all Fields");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "User Not Found");
  }

  const checkPassword = await user.isPasswordCorrect(oldPassword);

  if (!checkPassword) {
    throw new ApiError(401, "User Not Found");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// const refreshToken = asyncHandler(async (req, res) => {
// const incomingRefreshToken =
//      req.cookies.refreshToken || req.body.refreshToken;
//    if (!incomingRefreshToken) {
//      throw new ApiError(402, "No Refresh Token found");
//    }
//    try {
//      const decodedToken = jwt.verify(
//        incomingRefreshToken,
//        process.env.REFRESH_TOKEN_SECRET
//      );
//      const user = await User.findById(decodedToken?._id);
//      // Debugging logs
//      console.log("Incoming Refresh Token:", incomingRefreshToken);
//      console.log("Decoded Token ID:", decodedToken?._id);
//      console.log("Stored Refresh Token:", user?.refreshToken);
//      if (!user) {
//        throw new ApiError(401, "Invalid refresh token");
//      }
//      if (incomingRefreshToken !== user?.refreshToken) {
//        throw new ApiError(401, "Refresh token is expired or used");
//      }
//      const { accessToken, newRefreshToken } =
//        await genrateAccessTokenAndRefreshToken(user._id);
//      // Update the user's refresh token in the database
//      user.refreshToken = newRefreshToken;
//      await user.save();
//      const options = {
//        httpOnly: true,
//        secure: true,
//      };
//      return res
//        .status(200)
//        .cookie("accessToken", accessToken, options)
//        .cookie("refreshToken", newRefreshToken, options)
//        .json(
//          new ApiResponse(
//            200,
//            { accessToken, refreshToken: newRefreshToken },
//            "Access token refreshed"
//          )
//        );
//    } catch (error) {
//      throw new ApiError(401, error.message || "Invalid refresh token");
//    }
//  });

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(401, "Fill all Fields");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user, "Detaile Upadted"));
});

const updateUserAvtar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing on server");
  }

  const oldAvatar = req.user?.avatar;
  const public_id = oldAvatar.split('/').pop().split('.')[0];

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(402, "File noy uploaded on cloudinary");
  }

  await deleteFromCloudinary(public_id);
  

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Uploaded suceesfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "File noy uploaded on server");
  }
  const oldCoverImage = req.user?.coverImage;
  const public_id = oldCoverImage.split('/').pop().split('.')[0];

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const deleteImage = await deleteFromCloudinary(public_id);  
  console.log(deleteImage)

  if (!coverImage) {
    throw new ApiError(402, "File noy uploaded on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Uploaded suceesfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username Not Found");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subcribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subcribedToCount: {
          $size: "$subcribedTo",
        },
        isSubcribed: {
          $cond: {
            // if: { $in: [req.user?._id, $subscribers.subscriber] },
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subcribedToCount: 1,
        isSubcribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel, "User channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch History fatched"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  currentPasswordChange,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvtar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
