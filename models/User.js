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
    },
    picture: {
      type: String,
      default: "",
    },
    loginType: {
      type: String,
      default: "direct",
    },
    state: {
      type: String,
      default: "other",
    },
    status: {
      type: String,
      default: "pending",
    },
    radius: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        type: String,
        default: function () {
          return [];
        },
      },
    ],
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
    blockedImages: [{ type: String, default: [] }],
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
