const express = require("express");
const router = express.Router();

const { fetchLoopRoutes } = require("../controllers/loopRoute");

router.get("/looproute/:mapid", fetchLoopRoutes);

module.exports = router;
