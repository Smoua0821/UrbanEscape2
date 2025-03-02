const mongoose = require("mongoose");

const ActivationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  codeId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

const ActivationCode = mongoose.model("ActivationCode", ActivationCodeSchema);

module.exports = ActivationCode;
