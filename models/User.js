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
    capturedImages: [
      {
        type: String,
      },
    ],
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
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
