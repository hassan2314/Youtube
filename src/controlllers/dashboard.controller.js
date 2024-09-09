import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, 'Invalid Channel ID');
    }

    // Get total number of videos for the channel
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // Get total number of subscribers for the channel
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // Get total number of views for all videos of the channel
    const totalViews = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    // Get total number of likes for all videos of the channel
    const totalLikes = await Like.aggregate([
        { $lookup: { from: "videos", localField: "video", foreignField: "_id", as: "video" } },
        { $unwind: "$video" },
        { $match: { "video.owner": new mongoose.Types.ObjectId(channelId) } },
        { $count: "totalLikes" }
    ]);

    return res.status(200).json(new ApiResponse(200, {
        totalVideos,
        totalSubscribers,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalLikes || 0
    }, 'Channel stats fetched'));
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;
    const { page = 1, limit = 10 } = req.query;
  
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError(400, "Invalid Channel ID");
    }
  
    // Pagination options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };
  
    // Define the aggregation pipeline
    const pipeline = [
      { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
    ];
  
    // Fetch paginated results using aggregatePaginate
    const result = await Video.aggregatePaginate(Video.aggregate(pipeline), options);
  
    return res.status(200).json(new ApiResponse(200, result, "Channel videos fetched"));
  });
  


export {
    getChannelStats, 
    getChannelVideos
    }