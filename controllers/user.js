const User = require("../models/User");
const userProfile = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  return res.render("pages/profile", {
    user: user,
  });
};

const captureImage = async (req, res) => {
  const { image } = req.body;

  // Check if image is provided
  if (!image) return res.status(404).end("Invalid Request");

  try {
    // Find user based on email
    const user = await User.findOne({ email: req.user.email });

    // If user is not found, return an Unauthorized error
    if (!user) return res.status(400).json({ message: "Unauthorised!" });

    const capturedImages = user.capturedImages;

    // Check if the image already exists
    if (capturedImages.includes(image)) {
      return res
        .status(400)
        .json({ message: "Image already exists!", code: 1 });
    }

    // Add the new image to the user's capturedImages array
    capturedImages.push(image);

    // Update the user's capturedImages array in the database
    await User.updateOne(
      { email: req.user.email }, // Use req.user.email here
      { $set: { capturedImages } }
    );

    return res
      .status(200)
      .json({ message: "Image Captured successfully!", code: 1 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while capturing the image.",
      error: error.message || error,
      code: 0,
    });
  }
};

module.exports = { userProfile, captureImage };
