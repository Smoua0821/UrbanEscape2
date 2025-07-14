const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const LoopRoute = require("../models/LoopRoute.js");
const Map = require("../models/Map");
const MapDynamics = require("../models/MapDynamics");

const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
require("dotenv").config();
async function fetchLoopRoutes(req, res) {
  let imgexist = [];
  let blockedImages = [];
  const { mapid } = req.params;
  if (!mapid)
    return res
      .status(400)
      .json({ status: "error", message: "No Id is Parsed!" });

  const map = await Map.findOne({ id: mapid });
  if (!map)
    return res
      .status(404)
      .status({ status: "error", message: "Invalid Id parsed!" });

  const token = req.cookies.sessionId;
  const data = await LoopRoute.find({ mapId: map._id });
  let lastGameWinner = true;
  if (token) {
    try {
      const userO = await jwt.verify(token, process.env.JWT_SECRET);
      if (userO) {
        const user = await User.findOne({ email: userO.email });
        if (user) {
          blockedImages = user.blockedImages;

          if (
            user?.capturedImages?.find((d) => mapid === d.mapId)?.gameStatus ==
            "lose"
          )
            lastGameWinner = false;

          // if (user.email == process.env.ADMIN_EMAIL) return res.json(data);
          imgexist = user.capturedImages.find((ci) => ci.mapId === map.id);
          if (!imgexist) imgexist = [];
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  let filteredImages = data
    .filter(
      (d) =>
        !blockedImages.includes(d._id) &&
        (!lastGameWinner ? !imgexist.images?.includes(d._id) : true)
    )
    .map((d) => {
      if (d?.path?.length == 0) {
        d.mode = "custom";
      }
      return d;
    });
  filteredImages.forEach((item) => {
    if (item.quiz) {
      item.quiz = {
        mode: item.quiz.mode,
        question: item.quiz.question,
        options: item.quiz.options,
      };
    }
  });
  res.json({
    status: "success",
    mapGameSetting: map.pacman,
    route: filteredImages,
    preset: map?.preset,
  });
}

async function saveLoopRoutes(req, res) {
  let {
    title,
    description,
    polygonCoords,
    image,
    radius,
    speed,
    size,
    mapId,
    opacity,
    mode = "custom",
    presetCoords,
    quiz,
  } = req.body;

  if (!mapId)
    return res
      .status(400)
      .json({ status: "error", message: "No MAP is Selected" });

  const map = await Map.findOne({ id: mapId });
  if (!map)
    return res
      .status(404)
      .json({ status: "error", message: "No map Found with corresponding ID" });

  if (presetCoords?.length <= 0) mode = "custom";

  let quizData = null;

  if (
    quiz &&
    typeof quiz.quizQuestion === "string" &&
    quiz.quizQuestion.trim() !== "" &&
    quiz.quizAnswer &&
    parseInt(quiz.quizAnswer) > 0 &&
    parseInt(quiz.quizAnswer) < quiz.options.length &&
    Array.isArray(quiz.options) &&
    quiz.options.length > 0 &&
    quiz.options.every((opt) => typeof opt === "string" && opt.trim() !== "")
  ) {
    quizData = {
      mode: "on",
      question: quiz.quizQuestion.trim(),
      options: quiz.options.map((opt) => opt.trim()),
      answerIndex: parseInt(quiz.quizAnswer) - 1,
    };
  }

  const newLoopRoute = new LoopRoute({
    title,
    description,
    polygonCoords,
    image,
    radius,
    speed,
    size,
    opacity,
    mapId: map._id,
    mode,
    path: mode === "custom" ? [] : presetCoords,
    ...(quizData && { quiz: quizData }), // Add quiz only if valid
  });

  try {
    const savedLoopRoute = await newLoopRoute.save();

    // Add quiz warning if quiz was invalid or missing
    const response = {
      status: "success",
      message: "Loop route saved successfully",
      data: savedLoopRoute,
    };

    if (quiz && !quizData) {
      response.warning = "Quiz data was invalid and not saved.";
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ status: "error", error: error.message });
  }
}

async function updateLoopRoutes(req, res) {
  const {
    title,
    description,
    image,
    radius,
    speed,
    size,
    opacity,
    loopId,
    quiz,
  } = req.body;

  if (!loopId) {
    return res
      .status(400)
      .json({ status: "error", message: "Missing required Parameters!" });
  }

  try {
    const route = await LoopRoute.findById(loopId);
    if (!route) {
      return res
        .status(404)
        .json({ status: "error", message: "No Route Found" });
    }

    let dataToSave = {
      title,
      description,
      image,
      radius,
      speed,
      size,
      opacity,
    };

    if (
      quiz &&
      typeof quiz.quizQuestion === "string" &&
      quiz.quizQuestion.trim() !== "" &&
      quiz.quizAnswer &&
      parseInt(quiz.quizAnswer) > 0 &&
      parseInt(quiz.quizAnswer) < quiz.options.length &&
      Array.isArray(quiz.options) &&
      quiz.options.length > 0 &&
      quiz.options.every((opt) => typeof opt === "string" && opt.trim() !== "")
    ) {
      dataToSave.quiz = {
        mode: "on",
        question: quiz.quizQuestion.trim(),
        options: quiz.options.map((opt) => opt.trim()),
        answerIndex: parseInt(quiz.quizAnswer) - 1,
      };
    } else {
      return res.json({ status: "error", message: "Invalid Quiz parameters!" });
    }

    await LoopRoute.updateOne({ _id: loopId }, { $set: dataToSave });

    return res.json({
      status: "success",
      message: "Route Updated successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      error: error.message || error,
    });
  }
}

const deleteRoute = async (req, res) => {
  const { routeId } = req.body;
  if (!routeId) return res.status(404).end("Invalid request");

  try {
    const route = await LoopRoute.findOne({ _id: routeId });
    if (!route) return res.status(404).end("No Route Found");

    await LoopRoute.deleteOne({ _id: routeId });

    return res.json({
      status: "success",
      message: "Route Deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      error: error.message || error,
    });
  }
};

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  res.json({ imageName: req.file.filename });
};

const deleteImage = async (req, res) => {
  const { dataImg } = req.body;
  if (!dataImg)
    return res.status(400).json({ message: "Missing required parameters" });

  try {
    await LoopRoute.deleteMany({ image: dataImg });
    const imgLoc = path.join(__dirname, "../public", dataImg);
    if (fs.existsSync(imgLoc)) {
      fs.unlinkSync(imgLoc);
      return res.json({
        status: "success",
        message: "Image Deleted Successfully!",
      });
    } else {
      return res.status(404).json({ message: `${imgLoc} File does not exist` });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const deleteImageAll = async (req, res) => {
  await LoopRoute.deleteMany({});
  const imgLoc = path.join(__dirname, "../public/images/mapicons/");
  fs.rm(imgLoc, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error("Error deleting directory:", err);
      return;
    }

    console.log("Directory deleted successfully.");
    fs.mkdir(imgLoc, (err) => {
      if (err) {
        console.error("Error creating directory:", err);
      } else {
        console.log("Directory recreated successfully.");
      }
    });
  });
  return res.json({
    status: "success",
    message: "Deleted all the Images and Routes Successfully!",
  });
};

module.exports = {
  fetchLoopRoutes,
  saveLoopRoutes,
  deleteRoute,
  uploadImage,
  deleteImage,
  deleteImageAll,
  updateLoopRoutes,
};
