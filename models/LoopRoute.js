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
      type: String, // URL or file path for the image
      required: true,
    },
    radius: {
      type: Number, // Radius in meters
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const LoopRoute = mongoose.model("LoopRoute", loopRouteSchema);
module.exports = LoopRoute;
