const User = require("../models/User");
const Map = require("../models/Map");
const LoopRoute = require("../models/LoopRoute");
const mongoose = require("mongoose");
const PrimaryMap = require("../models/PrimaryMap");
const RedeemLink = require("../models/RedeemLink");
const Badge = require("../models/Badges");
const BlockHistory = require("../models/BlockHistory");

function findDifference(arr1, arr2) {
  return arr1.filter((item) => !arr2.includes(item));
}

function isSubset(smallArray, bigArray) {
  for (let i = 0; i < smallArray.length; i++) {
    const element = smallArray[i];
    const index = bigArray.indexOf(element);
    if (index === -1) {
      return false;
    }
    bigArray.splice(index, 1);
  }
  return true;
}

const userProfile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.redirect("/logout");

    const primaryMapData = await PrimaryMap.findOne().populate("map");
    const capturedImages = user.capturedImages;
    const userBadges = user.badges;
    const allBadges = await Badge.find({});

    // Create an array of { filename, description } for the user's badges
    const userBadgeDetails = userBadges.map((badge) => {
      const filename = badge.split("/").pop();
      const badgeInfo = allBadges.find((b) => b.file === filename);
      return {
        badge,
        description: badgeInfo
          ? badgeInfo.description
          : "No description available",
      };
    });
    return res.render("pages/profile", {
      user,
      capturedImages,
      userBadgeDetails,
      primaryMap: primaryMapData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error. Could not load the user profile.",
      error: error.message,
    });
  }
};

const captureImage = async (req, res) => {
  let { polyId, mapId, showingOnMap, quizAnswer } = req.body;
  if (!polyId || !mapId) return res.status(400).end("Invalid Request");
  const map = await Map.findOne({ id: mapId });
  if (!map) return res.json({ status: "error", message: "No Map Found!" });
  const user = await User.findOne({
    email: req.user.email,
  });
  if (!user) return res.status(369).redirect("/auth");
  const looproute = await LoopRoute.find({ mapId: map._id });
  if (
    showingOnMap == looproute.length &&
    looproute.length > 1 &&
    user.capturedImages
  ) {
    console.log("Updating.....");
    User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          "capturedImages.$[elem].images": [polyId],
          "capturedImages.$[elem].gameStatus": "lose",
        },
      },
      {
        arrayFilters: [{ "elem.mapId": mapId }],
      }
    ).catch((err) => {
      console.error(err);
    });
  }
  let capturedImages = user.capturedImages;
  let blockedImages = user.blockedImages;
  if (blockedImages.includes(polyId))
    return res.json({ message: "Already Redeemed!" });
  if (capturedImages.length == 0) {
    capturedImages.push({ mapId: mapId, images: [polyId] });
  } else {
    if (
      capturedImages.find(
        (cii) => cii.mapId.toString() === mapId && cii.images.includes(polyId)
      )
    )
      return res.json({ status: "success", message: "Exists Already" });
    const capturedImagesFilter = capturedImages.find(
      (ci) => ci.mapId.toString() === mapId
    );

    if (!capturedImagesFilter) {
      capturedImages.push({ mapId: mapId, images: [polyId] });
    } else {
      capturedImagesFilter.images.push(polyId);
    }
  }
  if (capturedImages.length == 0)
    return res.json({ message: "Something went Wrong!" });

  try {
    let isQuizRequired = 0;
    let isQuizPassed = 0;

    const quizSelector = looproute?.find((e) => e._id == polyId);

    if (quizSelector?.quiz?.mode === "on") {
      isQuizRequired = 1;

      if (quizAnswer?.index !== undefined && quizAnswer?.text) {
        const correctText = quizSelector.quiz.options[quizAnswer.index];
        const correctIndex = quizSelector.quiz.answerIndex;

        const blockhistory = await BlockHistory.findOne({
          loopRouteId: quizSelector._id,
          userId: req.user._id,
        });

        const futureTime = new Date(blockhistory?.timeExpire);
        const currentTime = new Date();
        const timeDiff = (futureTime - currentTime) / 1000;
        console.log(futureTime, currentTime);
        if (timeDiff > 0)
          return res.json({
            status: "error",
            type: "timeleft",
            heading: "Cooldown",
            message: `Please wait ${
              timeDiff > 60 ? (timeDiff / 60).toFixed(0) : timeDiff.toFixed(0)
            } ${timeDiff > 60 ? "minutes" : "seconds"}`,
            icon: "clock-o",
          });

        if (
          correctText === quizAnswer.text &&
          correctIndex === parseInt(quizAnswer.index)
        ) {
          isQuizPassed = 1;
        } else {
          const currentTime = new Date();
          console.log(quizSelector.quiz.blockTime, " Time Gain");
          const timeExpire = new Date(
            currentTime.getTime() + quizSelector.quiz.blockTime * 60 * 1000
          );

          await BlockHistory.findOneAndUpdate(
            { loopRouteId: quizSelector._id, userId: req.user._id },
            { timeExpire },
            { upsert: true, new: true }
          );

          return res.json({
            status: "error",
            type: "wrong",
            heading: "Incorrect Answer",
            message: "The Answer is incorrect!",
            icon: "close",
          });
        }
      } else {
        return res.json({
          status: "error",
          message: "Attempt quiz to capture this image!",
        });
      }
    }

    if (isQuizRequired && !isQuizPassed) {
      return res.json({
        status: "error",
        message: "Attempt quiz to capture this image!",
      });
    }

    await User.updateOne(
      { email: req.user.email },
      { $set: { capturedImages: capturedImages } }
    );
    return res.json({
      status: "success",
      message: "Image Captured successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Can't Update" });
  }
};

const removeCapturedImage = async (req, res) => {
  const { imageId } = req.body;
  if (!imageId || !req.user?.email)
    return res.json({ status: "error", message: "Invalid request!" });

  try {
    await User.updateOne(
      { email: req.user?.email },
      { $pull: { "capturedImages.$[].images": imageId } }
    );
    return res.json({
      status: "success",
      message: "Image deleted successfully!",
    });
  } catch (error) {
    console.log(error.message || error);
    return res.json({
      status: "error",
      message: error.message || "Something went Wrong!",
    });
  }
};

const getCaptureImage = async (req, res) => {
  let imgexist = [];
  const { mapId } = req.query;
  if (!mapId) return res.status(400).json({ message: "mapId can't be Empty!" });
  const map = await Map.findOne({ id: mapId });
  if (!map) return res.status(404).json({ message: "Map not found!" });
  const user = await User.findOne({ email: req.user.email });
  if (user) {
    imgexist = user.capturedImages.filter((ci) => ci.mapId === mapId);
    if (!imgexist) imgexist = [];
    imgexist = findDifference(imgexist, user.blockedImages);
  }
  return res
    .status(200)
    .json({ message: "Data Retrieved Successfully", imgexist: imgexist });
};

const routeRedeem = async (req, res) => {
  try {
    const { images, secrets, mapId, missionId } = req.body;

    if (!images || !secrets || !mapId || !missionId) {
      return res
        .status(400)
        .json({ message: "Images and secrets are required" });
    }

    if (images.length !== secrets.length) {
      return res
        .status(400)
        .json({ message: "Images and secrets must have the same length" });
    }

    const profilePics = await User.findOne({ email: req.user.email });
    if (
      !profilePics ||
      !profilePics.capturedImages ||
      profilePics.capturedImages.length == 0 ||
      !profilePics.capturedImages.find((d) => d.mapId === mapId) ||
      profilePics.capturedImages.find((d) => d.mapId === mapId).images.length ==
        0
    )
      return res.status(400).json({ message: "No Image in Profile!" });

    const imgAvailable = profilePics.capturedImages.find(
      (d) => d.mapId === mapId
    ).images;
    const blockedImages = profilePics.blockedImages;
    if (!isSubset(secrets, imgAvailable))
      return res
        .status(400)
        .json({ message: "Requested Image not exist in Your Profile" });

    const objectIds = secrets.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: `Invalid Secret: ${id}` });
      }
      return new mongoose.Types.ObjectId(id);
    });

    const data = await LoopRoute.find({ _id: { $in: objectIds } });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No matching records found" });
    }
    let isOkay = 1;
    for (let index = 0; index < data.length; index++) {
      const decimg = data[index].image.split("/");
      if (blockedImages.includes(secrets[index])) {
        isOkay = 0;
        console.log(`Image already Redeemed, Please capture different Images!`);
        break;
      }
      if (decimg[decimg.length - 1] !== images[index]) {
        isOkay = 0;
        console.log(
          `Required ${images[index]} given ${decimg[decimg.length - 1]}`
        );
        break;
      }
      blockedImages.push(secrets[index]);
    }
    const map = await Map.findOne({ id: mapId });
    const tarObj = map?.missions.find((d) => d._id == missionId);
    if (!tarObj) return res.status(400).json({ message: "No Mission found!" });
    const { v4: uuidv4 } = require("uuid");
    const newRedeemLink = new RedeemLink({
      id: uuidv4(),
      email: req.user.email,
      link: tarObj.redeemLink,
      accessed: 1,
    });
    const savedLink = await newRedeemLink.save();
    if (!isOkay) return res.status(405).json({ message: "Invalid Matching!" });

    await User.updateOne(
      { email: req.user.email },
      {
        $set: {
          capturedImages: profilePics.capturedImages,
          blockedImages: blockedImages,
        },
      }
    );

    if (tarObj.mtype == "badge") {
      try {
        const result = await User.updateOne(
          { email: req.user.email },
          { $push: { badges: tarObj.redeemLink } }
        );
        return res.status(200).json({
          status: "success",
          type: "badge",
        });
      } catch (err) {
        console.log(err);
      }
    }

    return res.status(200).json({
      message: "Perfectly Done!",
      redeemLink: `/user/redeem/route/${savedLink.id}`,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const handleRecentMaps = async (req, res) => {
  if (!req.user) return res.json({ success: false, message: "Unauthorised!" });
  const user = await User.findOne({ email: req.user.email });
  if (!user) return res.json({ success: false, message: "Unauthorised User!" });
  const { mapId } = req.body;
  let currentMaps = user.savedMaps;
  if (!currentMaps) currentMaps = [];
  try {
    const map = await Map.findOne({ id: mapId });
    if (!map) {
      const index = currentMaps.findIndex((d) => d.id == mapId);
      if (index !== -1) {
        currentMaps.splice(index, 1);
        await User.updateOne(
          { email: req.user.email },
          { $set: { savedMaps: currentMaps } }
        );
        return res.json({
          success: false,
          message: "Map no longer exists, removed from saved maps",
        });
      }
      return res.json({
        success: false,
        message: "Map not found in the database",
      });
    }
    if (currentMaps.find((d) => d.id == mapId)) {
      return res.json({
        success: false,
        message: "Map already exists in your saved maps",
      });
    }
    currentMaps.push({ id: mapId, name: map.name });
    await User.updateOne(
      { email: req.user.email },
      { $set: { savedMaps: currentMaps } }
    );

    return res.json({ success: true, message: "Map added to your saved maps" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const redeemLinkHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Parameters Required!" });

    const link = await RedeemLink.findOne({ id: id });
    if (!link) return res.status(404).json({ message: "Link Not Found" });
    if (link.email !== req.user.email)
      return res.status(403).json({ message: "Unauthorized Access" });

    const redirection = link.link;
    await RedeemLink.deleteMany({ email: link.email });

    return res.redirect(redirection);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

const badgeDelete = async (req, res) => {
  const { badge } = req.body;

  if (!badge) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid Badge ID" });
  }

  if (!req.user || !req.user._id) {
    return res.status(400).json({ status: "error", message: "No User found" });
  }

  try {
    const result = await User.updateOne(
      { _id: req.user._id },
      { $pull: { badges: badge } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Badge not found or already removed",
      });
    }

    return res
      .status(200)
      .json({ status: "success", message: "Badge Deleted Successfully!" });
  } catch (error) {
    console.error("Error deleting badge:", error);
    return res.status(500).json({ status: "error", message: "Server Error" });
  }
};
module.exports = {
  userProfile,
  captureImage,
  removeCapturedImage,
  getCaptureImage,
  routeRedeem,
  handleRecentMaps,
  redeemLinkHandler,
  badgeDelete,
};
