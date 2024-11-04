const express = require("express");
const router = express.Router();
router.get("/", (req, res) => {
  res.render("pages/admin", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
  });
});

module.exports = router;
