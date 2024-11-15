const express = require("express");
const router = express.Router();
const Map = require("../models/Map");
const User = require("../models/User");

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
  const mapUnId = map._id;
  const user = req.user;
  res.render("pages/home", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    user: user,
    mapParsed: mapId,
    title: map.name,
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
