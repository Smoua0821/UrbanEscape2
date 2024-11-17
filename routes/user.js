const express = require("express");
const router = express.Router();
const {
  userProfile,
  captureImage,
  getCaptureImage,
} = require("../controllers/user");

router.get("/profile", userProfile);
router.post("/profile/capture", captureImage);
router.get("/profile/capture", getCaptureImage);
module.exports = router;
