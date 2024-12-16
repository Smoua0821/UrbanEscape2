const express = require("express");
const router = express.Router();

const { fetchLoopRoutes } = require("../controllers/loopRoute");
const { getMarkerImage } = require("../controllers/admin");

router.get("/looproute/:mapid", fetchLoopRoutes);
router.get("/marker", getMarkerImage);
module.exports = router;
