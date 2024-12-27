const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
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
  fetchPrimaryMap,
  handlePrimaryMap,
  changeMarker,
  getMarkerImage,
  deleteMarkerImage,
  exportImages,
  importImages,
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

router.post("/delete/:id", deleteUser);

router.get("/map", fetchMaps);
router.post("/map", newMap);

router.get("/map/primary", fetchPrimaryMap);
router.post("/map/primary", handlePrimaryMap);

router.post("/map/duplicate", duplicateMap);
router.post("/map/delete", deleteMap);

router.get("/map/missions", MapMissions);
router.post("/map/missions", newMapMission);
router.post("/map/missions/remove", removeMapMission);

router.get("/export/users", exportExcel);
router.get("/export/images", exportImages);

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

module.exports = router;