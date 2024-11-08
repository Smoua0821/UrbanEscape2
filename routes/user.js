const express = require("express");
const router = express.Router();
const { userProfile, captureImage } = require("../controllers/user");

router.get("/profile", userProfile);
router.post("/profile/capture", captureImage);
module.exports = router;
