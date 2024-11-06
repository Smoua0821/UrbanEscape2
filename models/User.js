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
        enum: ["admin", "user"], // Allowed values for 'initial' role
        default: "user", // Default to 'user'
      },
      current: {
        type: String,
        enum: ["admin", "user", "deactivated"], // Allowed values for 'current' role
        default: "user", // Default to 'user'
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
