const MapDynamics = require("../models/MapDynamics");

async function updateUserEndTime(mapId, userId, newEndTime) {
  try {
    const result = await MapDynamics.updateOne(
      { mapId: mapId, "users.userId": userId },
      {
        $set: {
          "users.$[user].history.$[history].endTime": newEndTime,
        },
      },
      {
        arrayFilters: [
          { "user.userId": userId },
          { "history.startTime": { $exists: true } },
        ],
      }
    );

    if (result.nModified > 0) {
      console.log("User endTime updated successfully!");
    } else {
      console.log("No document was updated.");
    }
  } catch (error) {
    console.error("Error updating user endTime:", error);
  }
}

const winHandler = async (req, res) => {
  const { mapParsedIdRaw } = req.body;
  if (!mapParsedIdRaw || !req.user?._id)
    return res.json({ status: "error", message: "Invalid Argument" });
  const endTime = new Date();
  // updateUserEndTime(mapParsedIdRaw, req.user._id, endTime);
  const result = await MapDynamics.updateOne(
    {
      mapId: mapParsedIdRaw,
      "users.userId": req.user._id,
    },
    { $inc: { "users.$.lifes": +1 } }
  );
  res.json(result.toObject());
};

const loseHandler = async (req, res) => {
  const { mapId } = req.body;
  return res.send("lose");
};

module.exports = { loseHandler, winHandler };
