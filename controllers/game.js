const MapDynamics = require("../models/MapDynamics");

const winHandler = async (req, res) => {
  try {
    const { mapParsedIdRaw } = req.body;
    if (!mapParsedIdRaw || !req.user?._id)
      return res.json({ status: "error", message: "Invalid Argument" });

    const endTime = new Date();
    const getDoc = await MapDynamics.findOneAndUpdate(
      {
        mapId: mapParsedIdRaw,
        "users.userId": req.user._id,
      },
      { $inc: { "users.$.lifes": +1 } }
    );
    if (!getDoc)
      return res.json({ status: "error", message: "Document not found" });

    const historyList = getDoc.users.find(
      (d) => d.userId == req.user._id
    )?.history;
    if (!historyList)
      return res.json({ status: "error", message: "History not found" });

    const updateTime = historyList.pop();
    if (!updateTime)
      return res.json({ status: "error", message: "Update time not found" });

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
      return res.json({ status: "error", message: "Update failed" });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.json({ status: "error", message: "Internal Server Error" });
  }
};

const loseHandler = async (req, res) => {
  try {
    const { mapParsedIdRaw } = req.body;
    if (!mapParsedIdRaw || !req.user?._id)
      return res.json({ status: "error", message: "Invalid Argument" });

    const endTime = new Date();
    const getDoc = await MapDynamics.findOne({
      mapId: mapParsedIdRaw,
      "users.userId": req.user._id,
    });
    if (!getDoc)
      return res.json({ status: "error", message: "Document not found" });

    const historyList = getDoc.users.find(
      (d) => d.userId == req.user._id
    )?.history;
    if (!historyList)
      return res.json({ status: "error", message: "History not found" });

    const updateTime = historyList.pop();
    if (!updateTime)
      return res.json({ status: "error", message: "Update time not found" });

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
      return res.json({ status: "error", message: "Update failed" });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.json({ status: "error", message: "Internal Server Error" });
  }
};

module.exports = { loseHandler, winHandler };
