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
    launchTime: {
      type: Date,
      required: true,
    },
    pacman: [
      {
        speed: {
          type: Number,
          default: 5,
        },
        distance: {
          type: Number,
          default: 1000,
        },
        direction: {
          type: String,
          default: "North",
        },
      },
    ],
    playable: {
      type: Boolean,
      default: false,
    },
    missions: [
      {
        redeemLink: {
          type: String,
        },
        name: {
          type: String,
        },
        mtype: {
          type: String,
          enum: ["badge", "url"],
          default: "url",
          required: true,
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
