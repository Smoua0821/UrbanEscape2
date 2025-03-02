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
  verifyActivationEmail,
} = require("../controllers/login");

router.get("/", loginPage);

router.post("/", loginValidate);

router.get("/verify/:codeId", verifyActivationEmail);

router.get("/password/recovery", (req, res) => {
  return res.render("pages/passwordRecovery", {
    title: "Set Password",
    type: "setpassword",
    CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
  });
});

router.post("/signup", newUser);

router.get("/countries", provinceList);

router.post("/plugins", pluginLoginController);
router.get("/verifyPlugin", setPluginLogin);

router.get("/github/callback", gitOAuthVerify);
module.exports = router;
