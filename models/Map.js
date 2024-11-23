const mongoose = require("mongoose");

const mapSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    zoom: {
      type: Number,
      required: true,
      min: 0,
      max: 22,
    },
    missions: [
      {
        redeemLink: {
          type: String,
        },
        name: {
          type: String,
        },
        images: [
          {
            type: String,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

mapSchema.index({ id: 1 });
const Map = mongoose.model("Map", mapSchema);

module.exports = Map;
