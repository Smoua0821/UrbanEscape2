const mongoose = require("mongoose");
const PrimaryMap = require("./PrimaryMap");

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
    zoom: {
      type: Number,
      required: true,
      min: 0,
      max: 22,
    },
    missions: [
      {
        redeemLink: {
          type: String,
        },
        name: {
          type: String,
        },
        images: [
          {
            type: String,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

mapSchema.index({ id: 1 });
mapSchema.post("deleteOne", async function (doc) {
  try {
    const primaryMap = await PrimaryMap.findOne({ map: doc._id });

    if (primaryMap) {
      await primaryMap.deleteOne();
      console.log(`PrimaryMap deleted because the associated Map was deleted.`);
    }
  } catch (err) {
    console.error("Error deleting PrimaryMap:", err);
  }
});

const Map = mongoose.model("Map", mapSchema);

module.exports = Map;
