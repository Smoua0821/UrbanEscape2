const mongoose = require("mongoose");
const BadgeSchema = new mongoose.Schema({
  dir: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});

const Badge = mongoose.model("Badge", BadgeSchema);
module.exports = Badge;
