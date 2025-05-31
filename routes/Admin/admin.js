const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { updateGameSettings } = require("../../controllers/game");
const {
  adminPage,
  deleteUser,
  fetchMaps,
  newMap,
  deleteMap,
  MapMissions,
  duplicateMap,
  newMapMission,
  removeMapMission,
  exportExcel,
  changeMarker,
  getMarkerImage,
  deleteMarkerImage,
  exportImages,
  exportPacmanImages,
  exportBadges,
  exportTutorial,
  importImages,
  importPacmanImages,
  importBadges,

  settingsUpdate,
  updateMapDate,
  presetHandler,
  renderPreset,
  importTutorialPicture,
} = require("../../controllers/Admin/admin");
const {
  fetchLoopRoutes,
  saveLoopRoutes,
  deleteRoute,
  uploadImage,
  deleteImage,
  deleteImageAll,
  updateLoopRoutes,
} = require("../../controllers/loopRoute");

router.get("/preset/:mapId", renderPreset);
router.post("/preset/:mapId", presetHandler);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/mapicons");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get("/", adminPage);

router.get("/looproute", fetchLoopRoutes);
router.post("/looproute", saveLoopRoutes);
router.post("/looproute/delete", deleteRoute);
router.post("/looproute/update", updateLoopRoutes);
router.post("/looproute/image", upload.single("image"), uploadImage);
router.post("/looproute/image/delete", deleteImage);
router.post("/looproute/image/delete/all", deleteImageAll);

const storageMarker = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    const randomName = "marker_" + Date.now();
    const extname = path.extname(file.originalname);
    const newFilename = randomName + extname;

    cb(null, newFilename);
  },
});
const uploadMarker = multer({ storage: storageMarker });

router.post("/map/marker", uploadMarker.single("image"), changeMarker);
router.post("/map/marker/delete", deleteMarkerImage);
router.get("/map/marker", getMarkerImage);

const storageMarkerBG = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/map_countdown");
  },
  filename: function (req, file, cb) {
    const newFilename = `${req.params.tarId}.jpg`;

    cb(null, newFilename);
  },
});
const uploadMarkerBG = multer({ storage: storageMarkerBG });
router.post(
  "/map/background/:tarId",
  uploadMarkerBG.single("image"),
  (req, res) => {
    try {
      if (
        fs.existsSync(`public/images/map_countdown/${req.params.tarId}.jpg`)
      ) {
        res
          .status(200)
          .json({ status: "success", message: "Image Uploaded Successfully" });
      } else {
        res
          .status(404)
          .json({ status: "success", message: "Image Uploading Failed!" });
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ status: "error", message: "Something went wrong" });
    }
  }
);

router.post("/delete/:id", deleteUser);

router.get("/map", fetchMaps);
router.post("/map", newMap);

router.post("/map/update/launch", updateMapDate);

router.post("/map/duplicate", duplicateMap);
router.post("/map/delete", deleteMap);

router.get("/map/missions", MapMissions);
router.post("/map/missions", newMapMission);
router.post("/map/missions/remove", removeMapMission);

router.get("/export/users", exportExcel);
router.get("/export/images", exportImages);
router.get("/export/images/pacman", exportPacmanImages);
router.get("/export/badges", exportBadges);
router.get("/export/tutorial", exportTutorial);

const storageImportImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./");
  },
  filename: function (req, file, cb) {
    const randomName = "import_image_" + Date.now();
    const extname = path.extname(file.originalname);
    const newFilename = randomName + extname;

    cb(null, newFilename);
  },
});

const uploadImportImage = multer({ storage: storageImportImage });

router.post(
  "/import/images",
  uploadImportImage.single("zipFile"),
  importImages
);

router.post(
  "/import/images/pacman",
  uploadImportImage.single("zipFile"),
  importPacmanImages
);

router.post(
  "/import/badges",
  uploadImportImage.single("zipFile"),
  importBadges
);

router.post(
  "/import/tutorial",
  uploadImportImage.single("zipFile"),
  importImages
);

const tutorialImageUploader = require("../../config/tutorialUploader");

router.post(
  "/upload/tutorial/picture",
  tutorialImageUploader.single("tutorialPic"),
  importTutorialPicture
);

router.get("/upload/tutorial/picture", (req, res) => {
  try {
    const tutorialDir = path.join(__dirname, "../../public/images/tutorial");

    // Ensure the directory exists
    if (!fs.existsSync(tutorialDir)) {
      fs.mkdirSync(tutorialDir, { recursive: true });
    }

    const files = fs.readdirSync(tutorialDir);
    const fileList = files.map((file) => {
      return {
        name: file,
        url: `/images/tutorial/${file}`,
      };
    });

    return res.json({
      status: "success",
      message: "Tutorial pictures fetched successfully.",
      data: fileList,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: "error",
      message:
        error.message ||
        "Something went wrong while fetching the tutorial pictures.",
    });
  }
});

router.post("/upload/tutorial/delete", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      status: "error",
      message: "Name of the file to delete is required.",
    });
  }
  const filePath = path.join(__dirname, "../../public/images/tutorial", name);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete the file.",
      });
    }
    return res.json({
      status: "success",
      message: "File deleted successfully.",
    });
  });
});

router.post("/settings/update", settingsUpdate);

router.post("/settings/update/pacman", updateGameSettings);

const storageMarkerPacman = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.body);
    cb(null, "./public/images/pacman");
  },
  filename: function (req, file, cb) {
    const newFilename = `${req.query.mapId}.gif`;

    cb(null, newFilename);
  },
});
const uploadMarkerPacman = multer({ storage: storageMarkerPacman });
router.post(
  "/map/upload/pacman",
  uploadMarkerPacman.single("pacman-image"),
  (req, res) => {
    console.log(req.query);
    res.json({ status: "ok", body: req.body });
  }
);

module.exports = router;
