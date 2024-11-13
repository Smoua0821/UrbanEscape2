const mongoose = require("mongoose");

const mapSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    settings: {
      zoom: {
        type: Number,
        required: true,
        min: 0,
        max: 22,
      },
      center: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Adding indexes for faster lookups on name and id fields
mapSchema.index({ id: 1 });
mapSchema.index({ name: 1 });

// Create the model
const Map = mongoose.model("Map", mapSchema);

module.exports = Map;
