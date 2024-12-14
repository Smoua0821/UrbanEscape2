const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  content: {
    type: String,
  },
});

const Settings = mongoose.model("Setting", SettingsSchema);

module.exports = Settings;
