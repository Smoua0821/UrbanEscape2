const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const Badge = require("../../models/Badges");
const {
  dirCreate,
  getDirs,
  deleteDir,
  getFiles,
  deleteFile,
  setDescription,
  getDescription,
} = require("../../controllers/Admin/badgeFile");

router.post("/create", dirCreate);
router.get("/fetch", getDirs);
router.post("/delete", deleteDir);

router.post("/description", setDescription);
router.get("/description", getDescription);

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

router.post("/file/new/:dirName", upload.single("file"), async (req, res) => {
  try {
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

    const saveBadge = new Badge({
      dir: dirName,
      file: file.filename,
      description: "",
    });

    await saveBadge.save();

    return res.status(200).json({
      status: "success",
      message: "File uploaded and badge saved successfully",
      fileName: file.filename,
      filePath: path.join("public/badges", dirName, file.filename),
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res
      .status(500)
      .json({
        status: "error",
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

module.exports = router;
