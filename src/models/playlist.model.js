import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    discription: {
      type: String,
      required: false,
    },
    videos: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.plugin(mongooseAggregatePaginate);
export const Playlist = mongoose.model("Playlist", playlistSchema);
