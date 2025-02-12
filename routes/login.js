const express = require("express");
const router = express.Router();
const {
  loginPage,
  loginValidate,
  newUser,
  provinceList,
  pluginLoginController,
  setPluginLogin,
} = require("../controllers/login");

router.get("/", loginPage);

// router.post("/", loginValidate);

// router.post("/new", newUser);

// router.get("/countries", provinceList);

router.post("/plugins", pluginLoginController);
router.get("/verifyPlugin", setPluginLogin);

module.exports = router;
