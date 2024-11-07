const express = require("express");
const router = express.Router();
router.get("/", (req, res) => {
  const user = req.user;
  res.render("pages/home", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    user: user,
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("sessionId", {
    httpOnly: true,
    sameSite: "strict",
  });
  return res.redirect("/");
});
module.exports = router;
