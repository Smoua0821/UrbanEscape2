const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const LoopRoute = require("../models/LoopRoute.js");
const Map = require("../models/Map");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
require("dotenv").config();
async function fetchLoopRoutes(req, res) {
  let imgexist = [];
  let blockedImages = [];
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

  const token = req.cookies.sessionId;
  const data = await LoopRoute.find({ mapId: map._id });
  if (token) {
    try {
      const userO = await jwt.verify(token, process.env.JWT_SECRET);
      if (userO) {
        const user = await User.findOne({ email: userO.email });
        if (user) {
          blockedImages = user.blockedImages;
          if (user.email == process.env.ADMIN_EMAIL) return res.json(data);
          imgexist = user.capturedImages.find((ci) => ci.mapId === map.id);
          if (!imgexist) imgexist = [];
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  const filteredImages = data.filter(
    (d) => !imgexist.images?.includes(d._id) && !blockedImages.includes(d._id)
  );

  res.json(filteredImages);
}

async function saveLoopRoutes(req, res) {
  const {
    title,
    description,
    polygonCoords,
    image,
    radius,
    speed,
    size,
    mapId,
    opacity,
  } = req.body;
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
    title,
    description,
    polygonCoords,
    image,
    radius,
    speed,
    size,
    opacity,
    mapId: map._id,
  });

  try {
    const savedLoopRoute = await newLoopRoute.save();
    res.status(201).json(savedLoopRoute);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateLoopRoutes(req, res) {
  const { title, description, image, radius, speed, size, opacity, loopId } =
    req.body;
  if (!loopId) {
    return res
      .status(400)
      .json({ status: "error", message: "Missing required Parameters!" });
  }

  try {
    const route = await LoopRoute.findById(loopId);
    if (!route) {
      return res
        .status(404)
        .json({ status: "error", message: "No Route Found" });
    }

    await LoopRoute.updateOne(
      { _id: loopId },
      {
        $set: { title, description, image, radius, speed, size, opacity },
      }
    );

    return res.json({
      status: "success",
      message: "Route Updated successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      error: error.message || error,
    });
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
module.exports = {
  fetchLoopRoutes,
  saveLoopRoutes,
  deleteRoute,
  uploadImage,
  updateLoopRoutes,
};
