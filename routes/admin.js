const express = require("express");
const router = express.Router();
const { adminPage } = require("../controllers/admin");
const { fetchLoopRoutes, saveLoopRoutes } = require("../controllers/loopRoute");

router.get("/", adminPage);

router.get("/looproute", fetchLoopRoutes);
router.post("/looproute", saveLoopRoutes);

module.exports = router;
