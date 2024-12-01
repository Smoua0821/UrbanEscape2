const User = require("../models/User");
const Map = require("../models/Map");
const LoopRoute = require("../models/LoopRoute");
const mongoose = require("mongoose");
const PrimaryMap = require("../models/PrimaryMap");
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
    const { images, secrets, mapId } = req.body;

    if (!images || !secrets) {
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
    if (!isOkay) return res.status(405).json({ message: "Invalid Matching!" });
    res
      .status(200)
      .json({ message: "Perfectly Done!", redeemLink: "https://google.com" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

module.exports = { userProfile, captureImage, getCaptureImage, routeRedeem };
