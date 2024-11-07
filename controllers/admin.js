const fs = require("fs");
const path = require("path");
const User = require("../models/User");
async function adminPage(req, res) {
  const user = req.user;
  if (user.role.current != "admin") return res.end("Unauthorised!");
  const dirPath = "./public/images/mapicons/";
  const icons = fs
    .readdirSync(dirPath)
    .filter((file) => fs.statSync(path.join(dirPath, file)).isFile())
    .map((file) => path.join(file));

  console.log(icons);
  const users = await User.find();
  res.render("pages/admin", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    users: users,
    icons: icons,
  });
}

const mongoose = require("mongoose");
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid user ID format",
    });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    await User.deleteOne({ _id: id });

    return res.json({
      status: "success",
      message: `${user.name} deleted successfully`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message || error,
    });
  }
};

module.exports = { adminPage, deleteUser };
