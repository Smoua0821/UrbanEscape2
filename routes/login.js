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
  requestPasswordRecovery,
  handlePasswordRecovery,
  setPasswordRecovery,
} = require("../controllers/login");

const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Allow only 5 login attempts per 15 minutes
  message: "Too many login attempts. Try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", loginPage);

router.post("/", loginLimiter, loginValidate);

router.get("/verify/:codeId", verifyActivationEmail);

router.get("/password/recovery", (req, res) => {
  return res.render("pages/passwordRecovery", {
    title: "Password Recovery",
    type: "request",
    CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
  });
});

router.post(
  "/password/recovery/request",
  loginLimiter,
  requestPasswordRecovery
);
router.get("/password/recovery/verify/:codeId", handlePasswordRecovery);
router.post(
  "/password/recovery/verify/:codeId",
  loginLimiter,
  setPasswordRecovery
);

router.post("/signup", loginLimiter, newUser);

router.get("/countries", provinceList);

router.post("/plugins", loginLimiter, pluginLoginController);
router.get("/verifyPlugin", setPluginLogin);

router.get("/github/callback", gitOAuthVerify);
module.exports = router;
