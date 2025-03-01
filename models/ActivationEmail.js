const mongoose = require("mongoose");

const ActivationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  codeId: {
    type: String,
    required: true, // Fixed the typo here
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Automatically deletes after 1 hour (TTL index)
  },
});

const ActivationCode = mongoose.model("ActivationCode", ActivationCodeSchema);

module.exports = ActivationCode;
