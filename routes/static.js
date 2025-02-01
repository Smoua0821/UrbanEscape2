const express = require("express");
const router = express.Router();
const Map = require("../models/Map");
const User = require("../models/User");
const LoopRoute = require("../models/LoopRoute");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const PrimaryMap = require("../models/PrimaryMap");

router.get("/", async (req, res) => {
  const user = await User.findOne({ email: req.user?.email });
  return res.render("pages/landing", {
    user: user,
  });
});
router.get("/map/:mapId", async (req, res) => {
  const { mapId } = req.params;
  if (!mapId) return res.status(301).redirect("/");
  const map = await Map.findOne({ id: mapId });
  if (!map) {
    const user = await User.findOne({ email: req.user?.email });
    if (user && user.savedMaps) {
      const savedMaps = user.savedMaps;
      const removedMaps = savedMaps.filter((d) => d.id != mapId);
      if (savedMaps.length != removedMaps.length) {
        await User.updateOne(
          { email: req.user?.email },
          { $set: { savedMaps: removedMaps } }
        );
        return res.status(301).redirect("/");
      }
    }
    return res.status(404).json({
      status: "error",
      message: "Map Not found!",
    });
  }
  const user = req.user;

  let imgexist = [];
  const token = req.cookies.sessionId;
  if (token) {
    try {
      const userO = await jwt.verify(token, process.env.JWT_SECRET);
      if (userO) {
        const user = await User.findOne({ email: userO.email });
        if (user) {
          imgexist = user.capturedImages.find(
            (ci) => ci.mapId.toString() === map._id.toString()
          );
          if (!imgexist) imgexist = [];
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  if (!imgexist) imgexist = [];
  function dateInFuture(isoDateString) {
    const now = new Date();
    const givenDate = new Date(isoDateString);
    return givenDate - now;
  }
  console.log(dateInFuture(map.launchTime));
  res.render("pages/home", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    user: user,
    mapParsed: mapId,
    title: map.name,
    missions: map.missions,
    imageExist: imgexist,
    timeFuture: dateInFuture(map.launchTime),
  });
});

router.get("/logout", async (req, res) => {
  try {
    res.clearCookie("sessionId", {
      httpOnly: true,
      sameSite: "strict",
    });

    const primaryMap = await PrimaryMap.findOne().populate("map").lean();
    if (primaryMap?.map) {
      return res.redirect(`/map/${primaryMap.map.id}`);
    }

    return res.redirect("/");
  } catch (error) {
    console.error("Error during logout:", error);
    return res
      .status(500)
      .json({ message: "An error occurred during logout. Please try again." });
  }
});

router.get("/static/image/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.status(400).end("Expired!");
    const data = await LoopRoute.findOne({ _id: id });
    if (!data) return res.status(404).end("404 - Not Found!");
    const imgPath = path.join(__dirname, "../public/", data.image);
    fs.access(imgPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error("Image not found:", imgPath);
        return res.status(404).send("Image not found");
      }
      res.sendFile(imgPath, (err) => {
        if (err) {
          console.error("Error sending file:", err.message);
          return res
            .status(500)
            .send("An error occurred while sending the file");
        }
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(500).send("An error occurred!");
  }
});

router.get("/privacy-policy", (req, res) => {
  return res.render("pages/privacy_policy");
});

module.exports = router;
