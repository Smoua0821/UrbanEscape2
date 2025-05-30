const express = require("express");
const router = express.Router();
const Map = require("../models/Map");
const User = require("../models/User");
const LoopRoute = require("../models/LoopRoute");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const MapDynamics = require("../models/MapDynamics");

router.get("/", async (req, res) => {
  const user = await User.findOne({ email: req.user?.email });
  return res.render("pages/landing", {
    user: user,
  });
});
router.get("/map/:mapId", async (req, res) => {
  let lifes = 0;
  let gameStarted = 0;
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
  const launchTime = map.launchTime;
  const curTime = new Date();

  curTime.setHours(curTime.getHours() - 2);

  if (launchTime.getTime() <= curTime.getTime()) gameStarted = 1;
  let user = req.user;

  let imgexist = [];
  const token = req.cookies.sessionId;
  if (token) {
    try {
      const userO = jwt.verify(token, process.env.JWT_SECRET);
      if (userO) {
        user = await User.findOne({ email: userO.email });
        if (user) {
          imgexist = user.capturedImages.find(
            (ci) => ci.mapId.toString() === map._id.toString()
          );
          if (!imgexist) imgexist = [];
          if (gameStarted && map?.playable) {
            const map_Id = map._id;
            const userId = user._id;

            let MapDynamicsData = await MapDynamics.findOne({
              mapId: map_Id,
              "users.userId": userId, // Ensure the user exists in the array
            });

            if (!MapDynamicsData) {
              console.log("User not found in this map. Creating entry...");
              MapDynamicsData = await MapDynamics.updateOne(
                { mapId: map_Id },
                {
                  $push: {
                    users: {
                      userId: userId,
                      lifes: 3,
                      history: [{ startTime: new Date() }],
                    },
                  },
                },
                { upsert: true }
              );
            } else {
              if (!map?.unlimitedLifes) {
                console.log(
                  "User found. Deducting life and setting startTime..."
                );
                MapDynamicsData = await MapDynamics.updateOne(
                  {
                    mapId: map_Id,
                    "users.userId": userId,
                    "users.lifes": { $gt: 0 },
                  }, // Prevent negative lives
                  {
                    $inc: { "users.$.lifes": -1 }, // Deduct 1 life
                    $push: { "users.$.history": { startTime: new Date() } }, // Set startTime
                  }
                );
              } else {
                console.log("Unlimited Lifes game started!");
                MapDynamicsData = await MapDynamics.updateOne(
                  {
                    mapId: map_Id,
                    "users.userId": userId,
                    "users.lifes": { $gt: 0 },
                  }, // Prevent negative lives
                  {
                    $push: { "users.$.history": { startTime: new Date() } }, // Set startTime
                  }
                );
              }
            }

            let updatedData = await MapDynamics.findOne(
              { mapId: map_Id, "users.userId": userId },
              { "users.$": 1 }
            );

            updatedData = updatedData.toObject();
            lifes = updatedData.users[0].lifes;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  if (!imgexist) imgexist = [];
  function dateInFuture(isoDateString) {
    const now = new Date();
    now.setHours(now.getHours() + -7 - now.getTimezoneOffset() / 60);
    const givenDate = new Date(isoDateString);
    console.log(`${now} --- ${givenDate}`);
    return givenDate - now;
  }
  const dataOutput = {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    user: user,
    mapParsed: mapId,
    mapParsedIdRaw: map._id,
    title: map.name,
    missions: map.missions,
    imageExist: imgexist,
    timeFuture: dateInFuture(map.launchTime),
    lifes: map.unlimitedLifes ? 99 : lifes,
    gameStarted: gameStarted,
    playable: map?.playable,
    pacman: map.pacman,
    gameWinningUrl: map.gameWinningUrl || null,
  };
  console.log(dataOutput);
  res.render("pages/home", dataOutput);
});

router.get("/logout", async (req, res) => {
  try {
    res.clearCookie("sessionId", {
      httpOnly: true,
      sameSite: "strict",
    });

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
      console.log(err);
      if (err) {
        console.error("Image not found:", imgPath);
        return res.status(404).send("Image not foundat the specified path");
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

router.get("/quick-tutorial", (req, res) => {
  try {
    const tutorialDir = path.join(__dirname, "../public/images/tutorial");

    if (!fs.existsSync(tutorialDir)) {
      fs.mkdirSync(tutorialDir, { recursive: true });
    }

    const images = fs.readdirSync(tutorialDir).filter((file) => {
      return /\.(jpe?g|png|gif|webp|svg)$/i.test(file); // Filter image files
    });

    const tutorialImages = images.map((image) => ({
      name: image,
      url: `/images/tutorial/${image}`,
    }));

    return res.render("pages/quick_tutorial", {
      title: "Quick Tutorial",
      user: req.user,
      tutorialImages,
    });
  } catch (error) {
    console.error("Error loading tutorial images:", error);
    return res.status(500).send("Server error loading tutorial.");
  }
});

router.get("/map/background/:tarId", (req, res) => {
  const pathN = `public/images/map_countdown/`;
  const imgPath = path.join(__dirname, "../", pathN, `${req.params.tarId}.jpg`);
  if (!fs.existsSync(imgPath))
    return res.sendFile(path.join(__dirname, "../", pathN, "default.jpg"));
  res.status(200).sendFile(imgPath);
});

router.get("/test", (req, res) => {
  return res.status(200).render("pages/passwordRecovery", {
    title: "Password Recovery",
    CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
    type: "request",
  });
});

const { findAllRanks } = require("../controllers/game");

router.get("/leaderboard/:mapId", findAllRanks);

module.exports = router;
