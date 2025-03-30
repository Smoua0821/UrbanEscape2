const mongoose = require("mongoose");

const MapDynamicSchema = new mongoose.Schema({
  mapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Map",
    required: true,
  },
  Leaderboard: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      timeTaken: {
        type: Number,
        required: true,
      },
      result: {
        type: String,
        enum: ["lose", "win"],
        default: "lose",
      },
    },
  ],
  users: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      lifes: {
        type: Number,
        default: 4,
        min: 0,
      },
      history: [
        {
          startTime: { type: Date, required: true },
          endTime: { type: Date },
        },
      ],
    },
  ],
});

const MapDynamics = mongoose.model("MapDynamics", MapDynamicSchema);

module.exports = MapDynamics;
