const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { dirName } = req.params;
    if (!dirName) {
      return cb(new Error("Directory name is required"));
    }
    const targetDir = path.join(__dirname, "../../public/badges", dirName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      Math.floor(Math.random() * 10000) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

router.post("/file/new/:dirName", upload.single("file"), (req, res) => {
  const { dirName } = req.params;
  if (!dirName) {
    return res
      .status(400)
      .json({ status: "error", message: "Directory name is required" });
  }
  const file = req.file;
  if (!file) {
    return res
      .status(400)
      .json({ status: "error", message: "No file uploaded" });
  }
  return res.json({
    status: "success",
    message: "File uploaded successfully",
    fileName: file.filename,
    filePath: path.join("public/badges", dirName, file.filename),
  });
});
module.exports = router;
