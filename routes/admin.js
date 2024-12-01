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
} = require("../controllers/admin");
const {
  fetchLoopRoutes,
  saveLoopRoutes,
  deleteRoute,
  uploadImage,
  updateLoopRoutes,
} = require("../controllers/loopRoute");

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

module.exports = router;
