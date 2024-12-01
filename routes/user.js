const express = require("express");
const router = express.Router();
const {
  userProfile,
  captureImage,
  getCaptureImage,
  routeRedeem,
} = require("../controllers/user");

router.get("/profile", userProfile);
router.post("/redeem/route", routeRedeem);
router.post("/profile/capture", captureImage);
router.get("/profile/capture", getCaptureImage);

module.exports = router;
