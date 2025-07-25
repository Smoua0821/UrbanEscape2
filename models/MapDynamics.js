const mongoose = require("mongoose");

const MapDynamicSchema = new mongoose.Schema({
  mapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Map",
    required: true,
  },
  Leaderboard: [
    {
      gameId: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      userName: {
        type: String,
        default: "",
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
      lastGameStatus: {
        type: String,
        enum: ["win", "lose"],
        default: "lose",
      },
    },
  ],
});

const MapDynamics = mongoose.model("MapDynamics", MapDynamicSchema);

module.exports = MapDynamics;
