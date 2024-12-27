const express = require("express");
const {
  createButton,
  deleteButton,
} = require("../../controllers/Admin/button");
const router = express.Router();

router.post("/new", createButton);
router.post("/delete", deleteButton);

module.exports = router;
