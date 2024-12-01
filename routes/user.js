const express = require("express");
const router = express.Router();
const {
  userProfile,
  captureImage,
  getCaptureImage,
  routeRedeem,
  handleRecentMaps,
} = require("../controllers/user");

router.get("/profile", userProfile);
router.post("/redeem/route", routeRedeem);
router.post("/profile/capture", captureImage);
router.get("/profile/capture", getCaptureImage);

router.post("/map/", handleRecentMaps);

module.exports = router;
