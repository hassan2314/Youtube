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
  const {content} = req.body;
  console.log(content)
  const owner = req.user;
  const { videoId } = req.params;

  if (!videoId?.trim()) {
    throw new ApiError(404, "Video Not Found");
  }

  if (!owner) {
    throw new ApiError(404, "User Not Found");
  }

  if (typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, "Invalid Comment Content");
  }

  const comment = await Comment.create({
    content: content.trim(),
    owner: owner._id,
    video: videoId,
  });
  if (!comment) {
    throw new ApiError(501,"Comment error")
  }

  const commentCreated = await Comment.findOne({ _id: comment._id })
    .populate("owner")
    .populate("video");

  return res
    .status(200)
    .json(new ApiResponse(200, commentCreated, "Comment Done"));
});

const updateComment = asyncHandler(async (req, res) => {
  console.log(req.body)
  const {updatedComment} = req.body;
  const {commentId} = req.params;

  console.log(updatedComment)

  if (typeof updatedComment !== 'string' || !updatedComment.trim()) {
    throw new ApiError(400, "Invalid Comment Content");
  }

  if (!commentId) {
    throw new ApiError(404, "Comment not found");
  }

  const updated = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {content: updatedComment.trim()},
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

  const {commentId} = req.params;

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
