const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const {
  dirCreate,
  getDirs,
  deleteDir,
  getFiles,
  deleteFile,
} = require("../../controllers/Admin/badgeFile");

router.post("/create", dirCreate);
router.get("/fetch", getDirs);
router.post("/delete", deleteDir);

router.post("/file/get", getFiles);
router.post("/file/delete", deleteFile);

module.exports = router;
