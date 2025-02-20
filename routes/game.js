const express = require("express");
const router = express.Router();
const { loseHandler, winHandler } = require("../controllers/game");

router.post("/win", winHandler);
router.post("/lose", loseHandler);

module.exports = router;
