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
module.exports = { adminPage };
