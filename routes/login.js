const express = require("express");
const router = express.Router();
const {
  loginPage,
  loginValidate,
  newUser,
  provinceList,
  pluginLoginController,
  setPluginLogin,
  gitOAuthVerify,
} = require("../controllers/login");

router.get("/", loginPage);

// router.post("/", loginValidate);

// router.post("/new", newUser);

// router.get("/countries", provinceList);

router.post("/plugins", pluginLoginController);
router.get("/verifyPlugin", setPluginLogin);

router.get("/github/callback", gitOAuthVerify);
module.exports = router;
