const mongoose = require("mongoose");

const loopRouteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Calgary",
    },
    description: {
      type: String,
      default: "All the Best for the Game!",
    },
    polygonCoords: {
      type: [
        {
          // Array of objects
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        },
      ],
    },
    path: {
      type: [
        {
          distance: { type: Number, required: true },
          angle: { type: Number, required: true },
        },
      ],
    },
    mode: {
      type: String,
      enum: ["custom", "preset"],
      default: "custom",
    },
    image: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      default: 5,
    },
    radius: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      required: true,
      default: 1,
    },
    opacity: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    border: {
      borderColor: {
        type: String,
        default: "#ffffff",
      },
      borderValue: {
        type: String,
        default: "none",
      },
    },
    mapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Map",
      required: true,
    },
    quiz: {
      mode: {
        type: String,
        enum: ["on", "off"],
        default: "off",
      },
      question: {
        type: String,
      },
      options: [
        {
          type: String,
        },
      ],
      answerIndex: {
        type: Number,
      },
      blockTime: {
        type: Number,
        default: 2, // Time in Minutes
      },
    },
  },
  {
    timestamps: true,
  }
);

const LoopRoute = mongoose.model("LoopRoute", loopRouteSchema);
module.exports = LoopRoute;
