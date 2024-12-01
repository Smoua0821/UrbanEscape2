const mongoose = require("mongoose");
const Map = require("./Map");

const PrimaryMapSchema = new mongoose.Schema(
  {
    map: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Map",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PrimaryMapSchema.statics.ensureSingleEntry = async function () {
  const count = await this.countDocuments();
  if (count > 1) {
    throw new Error("Only one PrimaryMap entry is allowed.");
  }
};

// Run this when creating the first document
PrimaryMapSchema.pre("save", async function (next) {
  await this.constructor.ensureSingleEntry();
  next();
});

const PrimaryMap = mongoose.model("PrimaryMap", PrimaryMapSchema);

module.exports = PrimaryMap;
