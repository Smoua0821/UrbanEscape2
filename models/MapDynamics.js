const mongoose = require("mongoose");

const MapDynamicSchema = new mongoose.Schema({
  mapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Map",
    required: true,
  },
  users: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      lifes: {
        type: Number,
        default: 3,
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
