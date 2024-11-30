const express = require("express");
const router = express.Router();
const {
  loginPage,
  loginValidate,
  newUser,
  provinceList,
} = require("../controllers/login");
router.get("/", loginPage);

router.post("/", loginValidate);

router.post("/new", newUser);

router.get("/countries", provinceList);
module.exports = router;
