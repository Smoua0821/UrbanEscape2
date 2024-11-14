const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const LoopRoute = require("../models/LoopRoute.js");
const Map = require("../models/Map");
async function fetchLoopRoutes(req, res) {
  const { mapid } = req.params;
  if (!mapid)
    return res
      .status(400)
      .json({ status: "error", message: "No Id is Parsed!" });

  const map = await Map.findOne({ id: mapid });
  if (!map)
    return res
      .status(404)
      .status({ status: "error", message: "Invalid Id parsed!" });

  const data = await LoopRoute.find({ mapId: map._id });
  res.json(data);
}

async function saveLoopRoutes(req, res) {
  const { polygonCoords, image, radius, speed, size, mapId } = req.body;
  if (!mapId)
    return res
      .status(400)
      .json({ status: "error", message: "No MAP is Selected" });
  const map = await Map.findOne({ id: mapId });
  if (!map)
    return res
      .status(404)
      .json({ status: "error", message: "No map Found with corresponding ID" });
  const newLoopRoute = new LoopRoute({
    polygonCoords,
    image,
    radius,
    speed,
    size,
    mapId: map._id,
  });

  try {
    const savedLoopRoute = await newLoopRoute.save();
    res.status(201).json(savedLoopRoute);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const deleteRoute = async (req, res) => {
  const { routeId } = req.body;
  if (!routeId) return res.status(404).end("Invalid request");

  try {
    const route = await LoopRoute.findOne({ _id: routeId });
    if (!route) return res.status(404).end("No Route Found");

    await LoopRoute.deleteOne({ _id: routeId });

    return res.json({
      status: "success",
      message: "Route Deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      error: error.message || error,
    });
  }
};

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  res.json({ imageName: req.file.filename });
};
module.exports = { fetchLoopRoutes, saveLoopRoutes, deleteRoute, uploadImage };
