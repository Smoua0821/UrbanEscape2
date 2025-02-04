const User = require("../../models/User");

const setMarkerRadius = async (req, res) => {
  const { id, radius } = req.body;
  if (!id || !radius)
    return res
      .status(400)
      .json({ status: "error", message: "Invalid Arguments" });

  try {
    await User.updateOne({ _id: id }, { $set: { radius: radius } });
    return res
      .status(200)
      .json({ status: "success", message: "Radius Changed!" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ status: "error", message: "Something went wrong!" });
  }
};

module.exports = { setMarkerRadius };
