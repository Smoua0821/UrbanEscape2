const mongoose = require("mongoose");

const blockHistorySchema = new mongoose.Schema(
  {
    loopRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoopRoute",
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    timeExpire: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const BlockHistory = mongoose.model("BlockHistory", blockHistorySchema);
module.exports = BlockHistory;
