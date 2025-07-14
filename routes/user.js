const express = require("express");
const router = express.Router();
const {
  userProfile,
  captureImage,
  getCaptureImage,
  routeRedeem,
  handleRecentMaps,
  redeemLinkHandler,
  badgeDelete,
} = require("../controllers/user");

router.get("/profile", userProfile);
router.post("/redeem/route", routeRedeem);

router.get("/redeem/route/:id", redeemLinkHandler);
router.post("/profile/capture", captureImage);
router.get("/profile/capture", getCaptureImage);

router.post("/map/", handleRecentMaps);

router.post("/profile/badge/delete", badgeDelete);

router.get("/shop", (req, res) => {
  return res.json({ status: "Maintenance Mode", message: "Available Soon!" });
});

module.exports = router;
