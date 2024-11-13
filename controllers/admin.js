const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const LoopRoute = require("../models/LoopRoute");
const Map = require("../models/Map");
async function adminPage(req, res) {
  const user = req.user;
  if (user.role.current != "admin") return res.end("Unauthorised!");
  const dirPath = "./public/images/mapicons/";
  const icons = fs
    .readdirSync(dirPath)
    .filter((file) => fs.statSync(path.join(dirPath, file)).isFile())
    .map((file) => path.join(file));

  const users = await User.find();
  res.render("pages/admin", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    users: users,
    icons: icons,
  });
}

const mongoose = require("mongoose");
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid user ID format",
    });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    await User.deleteOne({ _id: id });

    return res.json({
      status: "success",
      message: `${user.name} deleted successfully`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message || error,
    });
  }
};

const fetchMaps = async (req, res) => {
  const maps = await Map.find({});
  let message;
  if (!maps) message = "No Map Found, Please Create New!";
  message = `success`;
  return res.status(200).json({
    message: message,
    maps: maps,
  });
};
const newMap = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ status: "error", message: "Map name is required" });
  }

  try {
    const newMap = new Map({ name, id: uuidv4(), zoom: 15 });
    const savedMap = await newMap.save();
    res
      .status(201)
      .json({ status: "success", message: "Map created", data: savedMap });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create map",
      error: error.message,
    });
  }
};

const deleteMap = async (req, res) => {
  const { mapId } = req.body;
  if (!mapId)
    return res.status(404).json({ status: "error", message: "No Map Found" });

  try {
    const map = await Map.find({ id: mapId });
    if (!map)
      return res.status(404).json({ status: "error", message: "No Map Found" });
    await Map.deleteOne({ id: mapId });
    await LoopRoute.deleteMany({ mapId: map._id });
    return res
      .status(200)
      .status(200)
      .json({
        status: "success",
        message: `Map '${map.name}' Deleted Successfully!`,
      });
  } catch (error) {
    return res
      .status(401)
      .json({ status: "error", message: "Something went Wrong" });
  }
};
module.exports = { adminPage, deleteUser, fetchMaps, newMap, deleteMap };
