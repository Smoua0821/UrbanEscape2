const express = require("express");
const router = express.Router();
const Map = require("../models/Map");

router.get("/", (req, res) => {
  return res.send("Homepage");
});
router.get("/:mapId", async (req, res) => {
  const { mapId } = req.params;
  if (!mapId) return res.status(301).redirect("/");
  const map = await Map.findOne({ id: mapId });
  if (!map)
    return res.render("pages/notifier", {
      type: "error",
      message: "No Map Found",
    });
  const user = req.user;
  res.render("pages/home", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    user: user,
    mapParsed: mapId,
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
