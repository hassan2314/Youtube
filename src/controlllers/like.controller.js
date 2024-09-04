import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video ID not found in parameters");
  }

  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  const existingLike = await Like.findOne({
    video: videoObjectId,
    likedBy: userId,
  });

  if (existingLike) {
    // If a like exists, remove it (unlike)
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json(new ApiResponse(200, null, "Like removed"));
  } else {
    // If no like exists, create a new like
    const newLike = new Like({
      video: videoObjectId,
      likedBy: userId,
    });

    await newLike.save();
    return res.status(201).json(new ApiResponse(201, newLike, "Like added"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id; // Assuming `req.user` contains the authenticated user's info
  
    if (!commentId?.trim()) {
      throw new ApiError(400, "Comment ID not found in parameters");
    }
  
    // Convert commentId to ObjectId
    const commentObjectId = new mongoose.Types.ObjectId(commentId);
  
    // Check if the like already exists for this comment by the current user
    const existingLike = await Like.findOne({
      comment: commentObjectId,
      likedBy: userId,
    });
  
    if (existingLike) {
      // If a like exists, remove it (unlike)
      await Like.deleteOne({ _id: existingLike._id });
      return res
        .status(200)
        .json(new ApiResponse(200, existingLike, "Like removed"));
    } else {
      // If no like exists, create a new like for the comment
      const newLike = new Like({
        likedBy: userId,
        comment: commentObjectId, // Ensure the like is associated with a comment
        video: undefined, // Explicitly set video to undefined
      });
      
      await newLike.save();
      return res.status(201).json(new ApiResponse(201, newLike, "Like added"));
    }
});  

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Find all liked videos by the current user
  const likedVideos = await Like.aggregate([
    {
      $match: { likedBy: userId },
    },
    {
      $lookup: {
        from: "videos", 
        localField: "video",
        foreignField: "_id",
        as: "video_details",
      },
    },
    {
      $unwind: "$video_details", // Unwind to deconstruct the array
    },
    {
      $project: {
        _id: 1,
        video: "$video_details", // Project only the video details
      },
    },
  ]);

  // Return the liked videos
  return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
});

const getLikedComments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Find all liked videos by the current user
  const likedComments = await Like.aggregate([
    {
      $match: { likedBy: userId },
    },
    {
      $lookup: {
        from: "comments", 
        localField: "comment",
        foreignField: "_id",
        as: "comment_details",
      },
    },
    {
      $unwind: "$comment_details", // Unwind to deconstruct the array
    },
    {
      $project: {
        _id: 1,
        comment: "$comment_details", // Project only the video details
      },
    },
  ]);

  // Return the liked videos
  return res.status(200).json(new ApiResponse(200, likedComments, "Liked Comments fetched"));
});




export { toggleCommentLike, toggleVideoLike, getLikedVideos, getLikedComments };
