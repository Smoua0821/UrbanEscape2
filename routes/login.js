const express = require("express");
const router = express.Router();
const { loginPage, loginValidate, newUser } = require("../controllers/login");
router.get("/", loginPage);

router.post("/", loginValidate);

router.post("/new", newUser);

router.get("/countries", (req, res) => {
  const countries = ["Alberta", "Monnesta"];
  return res.json({ status: "success", countries: countries });
});
module.exports = router;
