const express = require("express");
const router = express.Router();

const { fetchLoopRoutes } = require("../controllers/loopRoute");
const { findAllRanks } = require("../controllers/game");
const {
  getMarkerImage,
  settingsImport,
  getPacmanImage,
} = require("../controllers/Admin/admin");
const { fetchAllButtons, findButton } = require("../controllers/Admin/button");

router.get("/looproute/:mapid", fetchLoopRoutes);
router.get("/marker", getMarkerImage);
router.get("/pacman/character/:id", getPacmanImage);

router.get("/buttons", fetchAllButtons);
router.post("/buttons", findButton);

router.get("/settings/import", settingsImport);

router.get("/game/leaderboard/:mapParsedIdRaw", findAllRanks);
module.exports = router;
