const express = require("express");
const router = express.Router();
const Map = require("../models/Map");
const User = require("../models/User");
const LoopRoute = require("../models/LoopRoute");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

router.get("/", (req, res) => {
  return res.render("pages/landing", {
    user: req.user,
  });
});
router.get("/map/:mapId", async (req, res) => {
  const { mapId } = req.params;
  if (!mapId) return res.status(301).redirect("/");
  const map = await Map.findOne({ id: mapId });
  if (!map)
    return res.status(404).json({
      status: "error",
      message: "Map Not found!",
    });
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
  res.render("pages/home", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    user: user,
    mapParsed: mapId,
    title: map.name,
    missions: map.missions,
    imageExist: imgexist,
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("sessionId", {
    httpOnly: true,
    sameSite: "strict",
  });
  return res.redirect("/");
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
        return res.status(404).send("Image not found");
      }
      res.sendFile(imgPath);
    });
  } catch (error) {
    console.log(error.message);
    return res.send("An Error Occured!");
  }
});
module.exports = router;
