const mongoose = require("mongoose");

const UserDynamicSchema = new mongoose.Schema(
  {
    mapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Map",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UserDynamic = mongoose.model("UserDynamic", UserDynamicSchema);

module.exports = UserDynamic;
