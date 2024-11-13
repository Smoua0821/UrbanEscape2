const mongoose = require("mongoose");

const loopRouteSchema = new mongoose.Schema(
  {
    polygonCoords: {
      type: [
        {
          // Array of objects
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        },
      ],
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
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
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const LoopRoute = mongoose.model("LoopRoute", loopRouteSchema);
module.exports = LoopRoute;
