const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      default: "other",
    },
    capturedImages: [
      {
        mapId: {
          type: String,
        },
        images: [
          {
            type: String,
          },
        ],
      },
    ],
    blockedImages: [{ type: String }],
    role: {
      initial: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
      },
      current: {
        type: String,
        enum: ["admin", "user", "deactivated"],
        default: "user",
      },
    },
    savedMaps: [
      {
        name: { type: String, required: true },
        id: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
