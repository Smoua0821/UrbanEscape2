const express = require("express");
const router = express.Router();
const { userProfile } = require("../controllers/user");

router.get("/profile", userProfile);
module.exports = router;
