const fs = require("fs");
const path = require("path");

async function adminPage(req, res) {
  const dirPath = "./public/images/mapicons/";
  const icons = fs
    .readdirSync(dirPath)
    .filter((file) => fs.statSync(path.join(dirPath, file)).isFile())
    .map((file) => path.join(file));

  console.log(icons);
  res.render("pages/admin", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    icons: icons,
  });
}
module.exports = { adminPage };
