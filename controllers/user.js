const User = require("../models/User");
const Map = require("../models/Map");
const userProfile = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  return res.render("pages/profile", {
    user: user,
  });
};

const captureImage = async (req, res) => {
  let { image, mapId } = req.body;
  if (!image || !mapId) return res.status(400).end("Invalid Request");
  const map = await Map.findOne({ id: mapId });
  if (!map) return res.json({ status: "error", message: "No Map Found!" });
  mapId = map._id.toString();
  const user = await User.findOne({
    email: req.user.email,
  });
  if (!user) return res.redirect("/auth");
  let capturedImages = user.capturedImages;
  if (capturedImages.length == 0) {
    capturedImages.push({ mapId: mapId, images: [image] });
  } else {
    if (
      capturedImages.find(
        (cii) => cii.mapId.toString() === mapId && cii.images.includes(image)
      )
    )
      return res.json({ message: "Exists Already" });
    const capturedImagesFilter = capturedImages.find(
      (ci) => ci.mapId.toString() === mapId
    );

    if (!capturedImagesFilter) {
      capturedImages.push({ mapId: mapId, images: [image] });
    } else {
      capturedImagesFilter.images.push(image);
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
    imgexist = user.capturedImages.filter(
      (ci) => ci.mapId.toString() === map._id.toString()
    );
    if (!imgexist) imgexist = [];
  }
  return res
    .status(200)
    .json({ message: "Data Retrieved Successfully", imgexist: imgexist });
};

module.exports = { userProfile, captureImage, getCaptureImage };
