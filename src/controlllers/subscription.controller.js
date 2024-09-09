import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel ID not found in parameters");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId);

  const existingSubscriber = await Subscription.findOne({
    channel: channelObjectId,
    subscriber: userId,
  });
  if (existingSubscriber) {
    await Subscription.deleteOne({ _id: existingSubscriber._id });
    return res.status(200).json(new ApiResponse(200, null, "Unsubscribed"));
  } else {
    const newSubscriber = new Subscription( {
      subscriber: userId,
      channel: channelObjectId,
    });

    await newSubscriber.save();  
    return res.status(200).json(new ApiResponse(200, newSubscriber, "Subscribed"));  // Corrected response format
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel ID not found in parameters");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId);
  const  subscribers = await Subscription.aggregate([
    {
        $match : { channel :channelObjectId}
    },
    {
        $addFields : {
            subscriber : '$subscriber'
        }
    }
  ])

});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
