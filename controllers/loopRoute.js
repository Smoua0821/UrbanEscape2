const LoopRoute = require("../models/loopRoute.js");
async function fetchLoopRoutes(req, res) {
  const data = await LoopRoute.find();
  res.json(data);
}

async function saveLoopRoutes(req, res) {
  const { polygonCoords, image, radius } = req.body;
  const newLoopRoute = new LoopRoute({
    polygonCoords,
    image,
    radius,
  });

  try {
    const savedLoopRoute = await newLoopRoute.save();
    res.status(201).json(savedLoopRoute);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { saveLoopRoutes };

module.exports = { fetchLoopRoutes, saveLoopRoutes };
