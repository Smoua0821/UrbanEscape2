const express = require("express");
const router = express.Router();
const { setMarkerRadius } = require("../../controllers/Admin/user");
router.post("/radius", setMarkerRadius);
module.exports = router;
