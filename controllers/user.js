const User = require("../models/User");
const Map = require("../models/Map");
const LoopRoute = require("../models/LoopRoute");
const mongoose = require("mongoose");
const PrimaryMap = require("../models/PrimaryMap");
const RedeemLink = require("../models/RedeemLink");
const { v4: uuidv4 } = require("uuid");
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
  const user = await User.findOne({ email: req.user.email });
  if (!user) return res.redirect("/logout");
  const primaryMapdata = await PrimaryMap.findOne().populate("map");
  return res.render("pages/profile", {
    user: user,
    primaryMap: primaryMapdata,
  });
};

const captureImage = async (req, res) => {
  let { polyId, mapId } = req.body;
  if (!polyId || !mapId) return res.status(400).end("Invalid Request");
  const map = await Map.findOne({ id: mapId });
  if (!map) return res.json({ status: "error", message: "No Map Found!" });
  const user = await User.findOne({
    email: req.user.email,
  });
  if (!user) return res.redirect("/auth");
  let capturedImages = user.capturedImages;
  if (capturedImages.length == 0) {
    capturedImages.push({ mapId: mapId, images: [polyId] });
  } else {
    if (
      capturedImages.find(
        (cii) => cii.mapId.toString() === mapId && cii.images.includes(polyId)
      )
    )
      return res.json({ message: "Exists Already" });
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
      if (decimg[decimg.length - 1] !== images[index]) {
        isOkay = 0;
        console.log(
          `Required ${images[index]} given ${decimg[decimg.length - 1]}`
        );
        break;
      }
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
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: "Parameters Required!" });
  const link = await RedeemLink.findOne({ id: id });
  if (!link || link.email !== req.user.email)
    return res.status(400).json({ message: "Link Not Found" });
  return res.status(200).json(link);
};

module.exports = {
  userProfile,
  captureImage,
  getCaptureImage,
  routeRedeem,
  handleRecentMaps,
  redeemLinkHandler,
};
