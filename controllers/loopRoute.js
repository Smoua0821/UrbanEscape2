const LoopRoute = require("../models/loopRoute.js");
async function fetchLoopRoutes(req, res) {
  const data = await LoopRoute.find();
  res.json(data);
}

async function saveLoopRoutes(req, res) {
  const { polygonCoords, image, radius, speed } = req.body;
  const newLoopRoute = new LoopRoute({
    polygonCoords,
    image,
    radius,
    speed,
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

module.exports = { fetchLoopRoutes, saveLoopRoutes, deleteRoute };
