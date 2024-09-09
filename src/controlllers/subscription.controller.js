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
    const newSubscriber = new Subscription({
      subscriber: userId,
      channel: channelObjectId,
    });

    await newSubscriber.save();
    return res
      .status(200)
      .json(new ApiResponse(200, newSubscriber, "Subscribed")); // Corrected response format
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel ID not found in parameters");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId);
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelObjectId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber_Details",
      },
    },
    {
      $unwind: "$subscriber_Details",
    },
    {
      $addFields: {
        name: "$subscriber_Details.fullname",
        avatar: "$subscriber_Details.avatar",
      },
    },
    {
      $project: {
        subscriber_Details: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
    },
  ]);

  // Send the response back to the client
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId?.trim()) {
    throw new ApiError(400, "Channel ID not found in parameters");
  }

  const subscribedObjectId = new mongoose.Types.ObjectId(subscriberId);
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        channel: subscribedObjectId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribed_Channels",
      },
    },
    {
      $unwind: "$subscribed_Channels",
    },
    {
      $addFields: {
        name: "$subscribed_Channels.fullname",
        avatar: "$subscribed_Channels.avatar",
      },
    },
    {
      $project: {
        subscribed_Channels: 0,

        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
    },
  ]);

  // Send the response back to the client
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed Channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
