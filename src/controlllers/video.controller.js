import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, discription } = req.body;
  if ([title, discription].some((field) => field?.trim() === "")) {
    throw new ApiError(404, "Fileds not found");
  }

  const videoLocalPath = req.files?.video[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoLocalPath) {
    throw new ApiError(404, "Video not found");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(404, "Thumbnail not found");
  }

  const videoOnCloudinary = await uploadOnCloudinary(videoLocalPath);
  if (!videoOnCloudinary) {
    throw new ApiError(502, "Error on uploading video on cloudinary");
  }

  const thumbnailOnCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnailOnCloudinary) {
    throw new ApiError(502, "Error on uploading video on cloudinary");
  }
  console.log(videoOnCloudinary.duration)
  const video = await Video.create({
    title: title,
    discription: discription,
    isPublished: true,
    thumbnail: thumbnailOnCloudinary.url,
    videoFile: videoOnCloudinary.url,
    duration: videoOnCloudinary.duration,
    owner: req.user?._id,
  });

  if (!video) {
    throw new ApiError(502, "Error on uploading video on cloudinary");
  }
  return res
  .status(200)
  .json(new ApiResponse(200, video,"Video Uploaded"))
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: get video by id
  if(!videoId?.trim()){
    throw new ApiError(400,'Video Link not Found')
  }
  const video = await Video.findById(videoId)
  if(!video){
    throw new ApiError(400, 'Video not found')
  }
  return res
  .status(200)
  .json(new ApiResponse(200, video,  "Video Fatched"))
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: update video details like title, description, thumbnail
  if(!videoId?.trim()){
    throw new ApiError(400, 'Video Not Found From params')
  }
  const {title, discription} = req.body;

  if(
    [title, discription].some((field)=> field.trim()== "")
  ){
      throw new ApiError(400, "Fill all fields")
  }

  const thumbnailLocalPath = req.file?.path;
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const updatedDetails = await Video.findByIdAndUpdate(
    videoId,
    {
      $set :
      {
        title : title,
        discription,
        thumbnail : thumbnail.url
      }
    },
    {
      new : true
    }
  )

  if (!updatedDetails) {
    throw new ApiError(404, 'Video Not Found')
  }
  return res 
  .status(200)
  .json(new ApiResponse(200,updatedDetails,"Video Updated"))
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
 
  if(!videoId?.trim()){
    throw new ApiError(400, 'Video Not Found From params')
  }
  
  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(400, 'Video not found')
  }
  const oldVideo = video?.videoFile;
  const public_id = oldVideo.split('/').pop().split('.')[0];
  if (!public_id) {
    throw new ApiError(400, 'Video not found')
  }
  await deleteFromCloudinary(public_id);

  
  
  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if(!deletedVideo) {
    throw new ApiError(400, 'Video not found')
  }
  return res
  .status(200)
  .json(new ApiResponse(200, deletedVideo, "Video Deleted"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate the videoId
  if (!videoId?.trim()) {
    throw new ApiError(400, 'Video ID not found in parameters');
  }

  // Find the video in the database by ID
  const video = await Video.findById(videoId);

  // Check if the video exists
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  // Toggle the isPublished status
  video.isPublished = !video.isPublished;

  // Save the updated video back to the database
  await video.save({validateBeforeSave: false });

  // Respond with the updated video information
  return res.status(200).json(new ApiResponse(200, video, "Video publish status updated successfully"));
});


export { publishVideo, getVideoById, updateVideo,deleteVideo,togglePublishStatus};
