const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const LoopRoute = require("../models/LoopRoute");
const Map = require("../models/Map");

async function adminPage(req, res) {
  const user = req.user;
  if (user.role.current !== "admin") return res.end("Unauthorized!");

  const dirPath = "./public/images/mapicons/";
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Read the icons in the directory
  const icons = fs
    .readdirSync(dirPath)
    .filter((file) => fs.statSync(path.join(dirPath, file)).isFile())
    .map((file) => path.join(file));

  // Fetch users from the database
  const users = await User.find();

  // Render the admin page with the necessary data
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
    const map = await Map.findOne({ id: mapId });
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

const newMapMission = async (req, res) => {
  const { mapId, missions } = req.body;
  if (!mapId || !missions)
    return res
      .status(400)
      .json({ status: "error", message: "Invalid Request" });

  try {
    const map = await Map.findOne({ id: mapId });
    if (!map)
      return res.status(404).json({ status: "error", message: "No Map Found" });

    const missionsExist = map.missions || [];

    if (missionsExist.includes(missions)) {
      return res
        .status(409)
        .json({ status: "error", message: "Duplicate Mission" });
    }

    if (missionsExist.find((me) => me.name === missions.name))
      return res.status(409).json({
        status: "error",
        message: `${missions.name} Already used, Try Different Name`,
      });

    missionsExist.push(missions);

    await Map.updateOne({ id: mapId }, { $set: { missions: missionsExist } });
    return res.status(200).json({
      status: "success",
      message: "Mission Added",
      data: missionsExist,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Server Error" });
  }
};

const removeMapMission = async (req, res) => {
  try {
    const { mapId, missionId } = req.body;
    if (!mapId || !missionId)
      return res
        .status(400)
        .json({ status: "error", message: "Missing Required Arguments!" });

    const map = await Map.findOne({ id: mapId });
    if (!map)
      return res
        .status(404)
        .json({ status: "error", message: "Map not Found!" });

    if (!Array.isArray(map.missions) || map.missions.length === 0)
      return res.status(204).json({
        status: "success",
        message: `No missions to delete for ${map.name}`,
      });

    const updatedMissions = map.missions.filter(
      (d) => d._id.toString() !== missionId
    );
    await Map.updateOne({ id: mapId }, { $set: { missions: updatedMissions } });

    return res.json({
      status: "success",
      message: "Mission Deleted Successfully!",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Server Error", error: error.message });
  }
};

const MapMissions = async (req, res) => {
  const { mapId } = req.query;
  if (!mapId)
    return res
      .status(400)
      .json({ status: "error", message: "Invalid Request" });

  try {
    const map = await Map.findOne({ id: mapId });
    if (!map)
      return res.status(404).json({ status: "error", message: "No Map Found" });

    return res.json({ missions: map.missions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something Went Wrong!" });
  }
};

const duplicateMap = async (req, res) => {
  const { name, id } = req.body;

  if (!name || !id) {
    return res.status(400).json({ message: "Missing Required Parameters!" });
  }

  try {
    const map = await Map.findOne({ id: id });

    if (!map) {
      return res.status(404).json({ message: "No Map Found to duplicate!" });
    }

    const newMap = map.toObject();
    newMap.name = name;
    newMap._id = undefined;
    newMap.id = uuidv4();
    newMap.createdAt = undefined;
    newMap.updatedAt = undefined;
    newMap.missions.forEach((d) => {
      d._id = undefined;
    });

    const duplicatedMap = new Map(newMap);
    const savedMap = await duplicatedMap.save();

    const routes = await LoopRoute.find({ mapId: map._id });

    if (routes && routes.length > 0) {
      for (const rout of routes) {
        const route = rout.toObject();
        route._id = undefined;
        route.mapId = savedMap._id;
        route.createdAt = undefined;
        route.updatedAt = undefined;

        const duplicateRoute = new LoopRoute(route);

        try {
          const savedRoute = await duplicateRoute.save(); // Save the duplicated route
          console.log(savedRoute); // Log the saved route
        } catch (error) {
          console.error("Error saving duplicated route:", error);
        }
      }
    }

    return res.status(200).json(savedMap);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    } else if (err.name === "ValidationError") {
      return res
        .status(422)
        .json({ message: "Validation Error", error: err.message });
    } else {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: err.message });
    }
  }
};

module.exports = {
  adminPage,
  deleteUser,
  fetchMaps,
  newMap,
  deleteMap,
  newMapMission,
  MapMissions,
  duplicateMap,
  removeMapMission,
};
