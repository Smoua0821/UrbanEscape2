const Map = require("../models/Map");
const MapDynamics = require("../models/MapDynamics");

const updateUserHistory = async (req, res, incrementLifes) => {
  try {
    const { mapParsedIdRaw } = req.body;
    if (!mapParsedIdRaw || !req.user?._id)
      return await res.json({ status: "error", message: "Invalid Argument" });

    const endTime = new Date();
    const getDoc = await MapDynamics.findOneAndUpdate(
      {
        mapId: mapParsedIdRaw,
        "users.userId": req.user._id,
      },
      incrementLifes ? { $inc: { "users.$.lifes": +1 } } : {}
    );
    if (!getDoc)
      return await res.json({ status: "error", message: "Document not found" });

    const historyList = getDoc.users.find(
      (d) => d.userId == req.user._id
    )?.history;
    if (!historyList)
      return await res.json({ status: "error", message: "History not found" });

    const updateTime = historyList.pop();
    if (!updateTime || !updateTime.startTime)
      return await res.json({
        status: "error",
        message: "Update time not found",
      });

    updateTime.endTime = endTime;
    historyList.push(updateTime);
    const timeTaken = parseInt(
      (updateTime.endTime - updateTime.startTime) / 1000
    );

    const result = await MapDynamics.updateOne(
      {
        mapId: mapParsedIdRaw,
        "users.userId": req.user._id,
      },
      {
        $set: {
          "users.$.history": historyList,
        },
        $push: {
          Leaderboard: {
            userId: req.user._id,
            timeTaken: timeTaken,
            timeSaved: Date.now(),
          },
        },
      }
    );

    if (!result.modifiedCount)
      return await res.json({ status: "error", message: "Update failed" });

    await res.json(result);
  } catch (error) {
    console.error(error);
    await res.json({ status: "error", message: "Internal Server Error" });
  }
};

const winHandler = async (req, res) => {
  await updateUserHistory(req, res, true);
};

const loseHandler = async (req, res) => {
  await updateUserHistory(req, res, false);
};

const updateGameSettings = async (req, res) => {
  try {
    let { activate, coords, radius, speed, mapId } = req.body;
    if (!activate || !coords || !radius || !speed || !mapId) {
      return await res
        .status(400)
        .json({ status: "error", message: "Invalid Argument" });
    }
    activate = activate === "true";
    radius = parseInt(radius);
    speed = parseInt(speed);
    if (radius > 100) radius = 100;
    if (speed > 100) speed = 100;
    if (radius < 0) radius = 0;
    if (speed < 0) speed = 0;
    if (!coords || !coords.lat || !coords.lng) {
      return await res
        .status(400)
        .json({ status: "error", message: "Invalid Coordinates" });
    }
    await Map.updateOne(
      {
        id: mapId,
      },
      {
        $set: {
          "pacman.activate": activate,
          "pacman.coords": coords,
          "pacman.radius": radius,
          "pacman.speed": speed,
          playable: activate,
        },
      }
    );
    return await res
      .status(200)
      .json({ status: "success", message: "Updated" });
  } catch (error) {
    console.error(error);
    await res.json({ status: "error", message: "Internal Server Error" });
  }
};

module.exports = { loseHandler, winHandler, updateGameSettings };
