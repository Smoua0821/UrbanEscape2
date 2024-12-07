const mongoose = require("mongoose");

const RedeemLinkSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  accessed: {
    type: Number,
    default: 0,
  },
});

const RedeemLink = mongoose.model("RedeemLink", RedeemLinkSchema);

module.exports = RedeemLink;
