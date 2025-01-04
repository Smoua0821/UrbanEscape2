const express = require("express");
const router = express.Router();

const { fetchLoopRoutes } = require("../controllers/loopRoute");
const {
  getMarkerImage,
  settingsImport,
} = require("../controllers/Admin/admin");
const { fetchAllButtons, findButton } = require("../controllers/Admin/button");

router.get("/looproute/:mapid", fetchLoopRoutes);
router.get("/marker", getMarkerImage);

router.get("/buttons", fetchAllButtons);
router.post("/buttons", findButton);

router.get("/settings/import", settingsImport);
module.exports = router;
