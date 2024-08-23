import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
  const content = req.body;
  const owner = req.user;
  const { videoId } = req.params;

  if (!videoId?.trim()) {
    throw new ApiError(404, "Video Not Found");
  }

  if (!owner) {
    throw new ApiError(404, "User Not Found");
  }

  if (!content) {
    throw new ApiError(404, "Comment is Missing");
  }

  const comment = await Comment.create({
    content: content,
    owner: owner._id,
    video: videoId,
  });

  const commentCreated = await Comment.findOne({ _id: comment._id })
    .populate("owner")
    .populate("video");

  return res
    .status(200)
    .json(new ApiResponse(200, commentCreated, "Comment Done"));
});

const updateComment = asyncHandler(async (req, res) => {
  const updatedComment = req.body;
  const commentId = req.params;

  if (!updatedComment) {
    throw new ApiError(404, "Message is missing");
  }

  if (!commentId) {
    throw new ApiError(404, "Comment not found");
  }

  const updated = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {content: updatedComment},
    },
    {
      new: true,
    }
  );

  if(!updated){
    throw new ApiError(404, "Comment not found in DB");
  }
  return res
  .status(200)
  .json(new ApiResponse(200,updated,"Message Updated"))
});

const deleteComment = asyncHandler(async (req, res) => {

  const commentId = req.params;

  if (!commentId) {
    throw new ApiError(404, "Comment not found");
  }

  const deleted = await Comment.findByIdAndDelete(
    commentId
  );

  if(!deleted){
    throw new ApiError(404, "Comment not found in DB");
  }
  return res
  .status(200)
  .json(new ApiResponse(200,deleted,"Message Deleted"))
});




export { addComment, updateComment, deleteComment, getVideoComments };
