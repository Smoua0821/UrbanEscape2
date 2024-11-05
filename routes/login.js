const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  if (req.user) {
    if (req.user.role == "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/");
    }
  }
  return res.render("pages/login");
});

module.exports = router;
