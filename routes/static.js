const express = require("express");
const router = express.Router();
const Map = require("../models/Map");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
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
module.exports = router;
