const mongoose = require("mongoose");

const mapSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
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
      default: Date.now,
    },
    playable: {
      type: Boolean,
      default: false,
    },
    pacman: {
      type: {
        speed: {
          type: Number,
          default: 0,
        },
        radius: {
          type: Number,
          default: 100,
        },
        activate: {
          type: Boolean,
          default: false,
        },
        coords: {
          type: {
            distance: {
              type: Number,
              default: 1,
            },
            angle: {
              type: Number,
              default: 0,
            },
          },
          default: { distance: 1, angle: 0 },
        },
      },
    },
    missions: [
      {
        redeemLink: {
          type: String,
          default: "",
        },
        name: {
          type: String,
          default: "",
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
            validate: {
              validator: function (v) {
                return /^(http|https):\/\/[^ "]+$/.test(v);
              },
              message: "Invalid URL format",
            },
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
mapSchema.index({ name: 1 });

const Map = mongoose.model("Map", mapSchema);

module.exports = Map;
