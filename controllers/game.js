const Map = require("../models/Map");
const User = require("../models/User");
const MapDynamics = require("../models/MapDynamics");
const { ObjectId } = require("mongodb");

const getRank = async (mapId, gameId = null) => {
  if (!ObjectId.isValid(mapId)) {
    return 0;
  }
  try {
    const pipeline = [
      { $match: { mapId: new ObjectId(mapId) } },
      { $unwind: "$Leaderboard" },
    ];

    if (gameId) {
      pipeline.push({ $match: { "Leaderboard.gameId": gameId } });
    }

    pipeline.push(
      { $sort: { "Leaderboard.timeTaken": 1 } },
      {
        $group: {
          _id: "$_id",
          leaderboard: { $push: "$Leaderboard" },
        },
      },
      {
        $unwind: { path: "$leaderboard", includeArrayIndex: "rank" },
      },
      {
        $project: {
          _id: 0,
          userId: "$leaderboard.userId",
          userName: "$leaderboard.userName",
          result: "$leaderboard.result",
          timeTaken: "$leaderboard.timeTaken",
          rank: { $add: ["$rank", 1] },
        },
      }
    );

    const result = await MapDynamics.aggregate(pipeline);
    return gameId ? (result.length > 0 ? result[0].rank : null) : result;
  } catch (error) {
    console.log(error);
    return 0;
  }
};

const updateUserHistory = async (req, res, incrementLifes) => {
  try {
    const { time, mapParsedIdRaw, mapParsedId } = req.body;
    if ((!mapParsedIdRaw && !mapParsedId) || !req.user?._id)
      return await res.json({ status: "error", message: "Invalid Argument" });

    const endTime = new Date();
    const getDoc = await MapDynamics.findOneAndUpdate(
      {
        mapId: mapParsedIdRaw,
        "users.userId": req.user._id,
      },
      incrementLifes ? { $inc: { "users.$.lifes": +1 } } : {}
    );
    if (incrementLifes) {
      User.updateOne(
        { _id: req.user._id },
        {
          $set: {
            "capturedImages.$[elem].gameStatus": "win",
          },
        },
        {
          arrayFilters: [{ "elem.mapId": mapParsedId }],
        }
      ).catch((err) => {
        console.error(err);
      });
    }
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
    let timeTaken = parseInt(
      (updateTime.endTime - updateTime.startTime) / 1000
    );
    const gameId = historyList[historyList.length - 1]._id;

    // if (time && timeTaken - time < 10) {
    //   timeTaken = time;
    // }

    if (time) {
      timeTaken = time;
    }

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
            userName: req.user.name,
            timeTaken: timeTaken,
            gameId: gameId,
            result: incrementLifes ? "win" : "lose",
          },
        },
      }
    );

    if (!result.modifiedCount)
      return await res.json({ status: "error", message: "Update failed" });

    const rank = await getRank(mapParsedIdRaw, gameId);

    await res.json({ status: "success", rank });
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
    let { activate, coords, radius, speed, mapId, distance, angle } = req.body;
    if (!activate || !coords || !radius || !speed || !mapId) {
      return await res
        .status(400)
        .json({ status: "error", message: "Invalid Argument" });
    }
    activate = activate === "true";
    distance = parseInt(coords?.distance);
    angle = parseInt(coords.angle);
    if (radius > 100) radius = 100;
    if (speed > 100) speed = 100;
    if (radius < 0) radius = 0;
    if (speed < 0) speed = 0;
    if (!angle) angle = 0;
    if (!distance) distance = 1;

    await Map.updateOne(
      {
        id: mapId,
      },
      {
        $set: {
          "pacman.activate": activate,
          "pacman.coords": { distance: distance, angle: angle },
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

const findAllRanks = async (req, res) => {
  const { mapId } = req.params;
  if (!mapId)
    return res.json({ status: "error", message: "Please Enter a Map ID" });
  const map = await Map.findOne({ id: mapId });
  if (!map)
    return res.status(404).json({ status: "error", message: "No Map found!" });

  const rank = await getRank(map._id);
  if (!rank || rank.length <= 0)
    return res.status(200).render("pages/Leaderboard", {
      nodata: true,
      isLoggedIn: req.user?.name ? true : false,
      title: map.name,
    });

  //ENABLING IFRAME ACCESSIBILITY
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  return res.status(200).render("pages/Leaderboard", {
    rank,
    nodata: false,
    isLoggedIn: req.user?.name ? true : false,
    title: map.name,
  });
};

module.exports = { loseHandler, winHandler, updateGameSettings, findAllRanks };
