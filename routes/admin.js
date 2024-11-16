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
  newMapMission,
} = require("../controllers/admin");
const {
  fetchLoopRoutes,
  saveLoopRoutes,
  deleteRoute,
  uploadImage,
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
router.post("/looproute/image", upload.single("image"), uploadImage);

router.post("/delete/:id", deleteUser);

router.get("/map", fetchMaps);
router.post("/map", newMap);
router.post("/map/delete", deleteMap);

router.post("/map/missions", newMapMission);

module.exports = router;
