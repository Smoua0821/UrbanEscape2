const mongoose = require("mongoose");

const ButtonsSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  text: {
    type: String,
    default: "Click Here",
  },
  link: {
    type: String,
    default: "https://google.com/",
  },
});

const Buttons = mongoose.model("Buttons", ButtonsSchema);

module.exports = Buttons;
