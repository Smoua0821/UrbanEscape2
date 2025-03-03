const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const Province = require("../models/Provinces");
const PrimaryMap = require("../models/PrimaryMap");
const axios = require("axios");
const ActivationCode = require("../models/ActivationEmail");
const { v4: uuidv4 } = require("uuid");
const { sendEmail } = require("../config/email");
const html_data = require("../config/emailActivationTempelate");
const verifyCaptcha = require("../config/verifyCaptcha");
const password_recovery_email = require("../config/password_recovery_email");

dotenv.config();

const generateActivationLink = async (
  email,
  type = "verification",
  user = {}
) => {
  const allowedTypes = ["verification", "recovery"];
  if (!allowedTypes.includes(type)) type = "verification";
  const codeId = uuidv4();
  const activation = await ActivationCode.create({
    email: email,
    codeId: codeId,
    type: type,
  });

  let tempelate = html_data(codeId);
  let subject = "UrbanEscape Account Activation";
  let from = "Verify";

  if (type == "recovery" && user && user.name && user.email) {
    tempelate = password_recovery_email(user.name, user.email, codeId);
    subject = "UrbanEscape Password Recovery";
    from = "Security";
  }

  const info = await sendEmail(email, subject, tempelate, from);

  console.log(info);
};

const loginPage = async (req, res) => {
  const token = req.cookies.sessionId;
  const { error } = req.query;
  if (!token)
    return res.render("pages/login", {
      GoogleClientID: process.env.GOOGLE_CLIENT_ID,
      error: error,
    });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user && user.role && user.role.current) {
      if (user.role.current === "admin") {
        return res.redirect("/admin");
      } else {
        return res.redirect("/");
      }
    } else {
      return res.status(401).render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "Invalid user Identity",
      });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).render("pages/login", {
      GoogleClientID: process.env.GOOGLE_CLIENT_ID,
      error: "Invalid session",
    });
  }
};

const loginValidate = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).lean();

    if (!user)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "Invalid Email",
      });
    if (!user.password)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: `This Login Method not supported for Your Account, Please try with ${
          user.loginType ? user.loginType : "Other Options"
        } and generate your password from the profile!`,
      });
    if (!password)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "No Password Provided!!",
      });

    let isMatched =
      email.toLowerCase() === process.env.ADMIN_EMAIL
        ? password === process.env.ADMIN_PASS
        : await bcrypt.compare(password, user.password);

    if (!isMatched)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "Invalid Password",
      });

    if (user.status != "verified") {
      if (user.status == "pending") {
        return res.render("pages/login", {
          GoogleClientID: process.env.GOOGLE_CLIENT_ID,
          error: `${user.name}, Your Account is not verified, Please verify it by clicking on verification link sent to your email ${user.email}`,
        });
      }

      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "Your Account is deactivated, Please contact Admin!",
      });
    }

    const token = jwt.sign(user, process.env.JWT_SECRET);
    res.cookie("sessionId", token, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    if (user.role.current === "admin") return res.redirect("/admin");

    const primaryMap = await PrimaryMap.findOne().populate("map").lean();
    if (primaryMap?.map) return res.redirect(`/map/${primaryMap.map.id}`);

    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.render("pages/login", {
      GoogleClientID: process.env.GOOGLE_CLIENT_ID,
      GitClientID: process.env.GIT_CLIENT_ID,
      error: "Something went wrong, please try again later.",
    });
  }
};

const newUser = async (req, res) => {
  try {
    const { name, email, password, state } = req.body;

    if (!name || !email || !password || !state) {
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      if (existingUser.status == "verified") {
        return res.render("pages/login", {
          GoogleClientID: process.env.GOOGLE_CLIENT_ID,
          error: `User with ${email} already exists, Try logging in using email and password!`,
        });
      } else {
        const checkActivation = await ActivationCode.findOne({
          email: email,
          type: "verification",
        });
        if (checkActivation)
          return res.render("pages/postRegister", {
            title: "Verification Pending",
            icon: "clock-o",
            message:
              "Verification for your Account is Pending, Please verify your account by clicking on Activation link sent to your email address.",
            type: "success",
          });

        await generateActivationLink(email);
        return res.render("pages/postRegister", {
          title: "Verification Link Resend",
          icon: "clock-o",
          message:
            "We have sent another activation link to your Email, Please activate your account.",
          type: "success",
        });
      }
    }
    let province = await Province.findOne({ name: state });
    if (!province) province = "other";
    const hashedPassword = await bcrypt.hash(password, 10);

    const newuser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      state: state,
    });

    await generateActivationLink(email);

    console.log(info);
    return res.status(200).render("pages/postRegister", {
      message: `Activation Link sent to ${email}`,
      type: "success",
      icon: "envelope",
      title: "Activation Link",
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).render("pages/postRegister", {
        type: "danger",
        message: "Email already exists. Please use a different email.",
        icon: "user",
        title: "Already Exist",
      });
    }
    return res.status(500).render("pages/postRegister", {
      type: "danger",
      message:
        "An error occurred during account creation. Please try again later.",
      title: "Error Occured",
      icon: "exclamation-triangle",
    });
  }
};

const provinceList = async (req, res) => {
  const data = await Province.find({});
  if (!data) return res.json({ status: "success", countries: [] });
  return res.json({ status: "success", countries: data });
};

const pluginLoginController = async (req, res) => {
  const { type, token } = req.body;
  const allowedTypes = ["google", "facebook"];

  if (!allowedTypes.includes(type))
    return res
      .status(400)
      .json({ status: "error", message: `${type} Not Allowed` });

  if (type === "google") {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload(); // Extract user info

      let user = await User.findOne({ email: payload.email });
      if (!user) {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          loginType: type,
          picture: payload.picture,
          status: "verified",
        });
      } else if (user.status != "verified") {
        await User.updateOne(
          { email: payload.email },
          { $set: { status: "verified" } }
        );
      }

      const tokenSigned = jwt.sign(user.toObject(), process.env.JWT_SECRET);

      return res.json({
        status: "success",
        token: tokenSigned,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        status: "error",
        message: "Login with Google Failed, please Try Again Later!",
      });
    }
  }
};

const setPluginLogin = (req, res) => {
  const { token } = req.query;
  if (!token)
    return res.render("pages/login", {
      GoogleClientID: process.env.GOOGLE_CLIENT_ID,
      error: "Login Failed!",
    });

  if (!jwt.verify(token, process.env.JWT_SECRET))
    return res.render("pages/login", {
      GoogleClientID: process.env.GOOGLE_CLIENT_ID,
      error: "invalid Token Assigned!",
    });
  return res
    .cookie("sessionId", token, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    })
    .redirect("/");
};

const gitOAuthVerify = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/auth?error=Invalid Github Login");

  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GIT_CLIENT_ID,
        client_secret: process.env.GIT_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: "application/json" } }
    );

    const access_token = response.data.access_token;
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userResponse?.data?.name) {
      return res.redirect("/auth?error=Invalid Identity Detected!");
    }
    const name = userResponse.data.name;
    const emailResponse = await axios.get(
      "https://api.github.com/user/emails",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const email = emailResponse.data.find((e) => e.primary).email;
    if (!email)
      return res.redirect(
        "/auth?error=No Email ID provided, Try different SignIN option!"
      );

    let user = await User.findOne({ email: email });
    if (!user) {
      user = await User.create({
        name: name,
        email: email,
        loginType: "github",
        picture: userResponse?.avatar_url,
      });
    }
    const tokenSigned = jwt.sign(user.toObject(), process.env.JWT_SECRET);
    if (!tokenSigned)
      return res.redirect("/auth?error=No Login Identifier found!");
    return res
      .cookie("sessionId", tokenSigned, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      })
      .redirect("/");
  } catch (error) {
    console.error(error);
    const errorMessage = error.response?.data?.error || "Authentication failed";
    res.status(500).send(errorMessage);
  }
};

const verifyActivationEmail = async (req, res) => {
  try {
    const { codeId } = req.params;
    if (!codeId)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "No Verification Token Found!",
      });

    const activation = await ActivationCode.findOne({
      codeId: codeId,
      type: "verification",
    });
    if (!activation)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "Invalid Verification Link!",
      });

    const user = await User.findOne({ email: activation.email });
    if (!user) {
      await ActivationCode.deleteOne({ codeId: codeId });
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "No Corresponding User Found to activate",
      });
    }

    if (user.status == "verified") {
      await ActivationCode.deleteOne({ codeId: codeId });
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error:
          "You are already verified, Please login using Email and password!",
      });
    }

    try {
      await User.updateOne(
        { email: activation.email },
        { $set: { status: "verified" } }
      );
      await ActivationCode.deleteOne({ codeId: codeId });
      return res.status(200).render("pages/postRegister", {
        message: `${user.name}, Your account is activated login with your email ${activation.email} and password!`,
        type: "success",
        title: "Verified",
        icon: "check",
      });
    } catch (error) {
      console.log(error);
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "Activation failed!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.render("pages/login", {
      GoogleClientID: process.env.GOOGLE_CLIENT_ID,
      error: "Something gone wrong!",
    });
  }
};

const requestPasswordRecovery = async (req, res) => {
  const { email, "g-recaptcha-response": gcaptcha } = req.body;
  if (!email || !gcaptcha)
    return res.status(200).render("pages/passwordRecovery", {
      title: "Password Recovery",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
      error: "All field are required!",
    });

  const verifiedcaptcha = await verifyCaptcha(gcaptcha);
  if (!verifiedcaptcha)
    return res.render("pages/passwordRecovery", {
      title: "Captcha Error",
      error: "Captcha Verification failed",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });

  const user = await User.findOne({ email: email });
  if (!user)
    return res.render("pages/passwordRecovery", {
      error: `No Account found with ${email}, please create a new account`,
      title: "No Account found!",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });

  if (user.status != "verified") {
    const activationCheck = await ActivationCode.findOne({
      email: email,
      type: "recovery",
    });
    if (!activationCheck) {
      await generateActivationLink(email);
    }
    return res.render("pages/passwordRecovery", {
      error: error,
      title:
        "Verification link sent to your email address, please verify your email!",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });
  } else {
    const activationCheck = await ActivationCode.findOne({
      email: email,
      type: "recovery",
    });
    if (!activationCheck) {
      await generateActivationLink(email, "recovery", {
        name: user.name,
        email: user.email,
      });
    }
  }

  return res.render("pages/passwordRecovery", {
    success:
      "Password link sent to your Email Address, Please Click on the link and set your password from there!",
    title: "Link Sent",
    CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
    type: "request",
  });
};

const handlePasswordRecovery = async (req, res) => {
  const { codeId } = req.params;
  if (!codeId)
    return res.render("pages/passwordRecovery", {
      error: "Broken Recovery Link",
      title: "Recover Password",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });

  const recoveryEmail = await ActivationCode.findOne({ codeId });
  if (!recoveryEmail)
    return res.render("pages/passwordRecovery", {
      error:
        "The link is Expired, please generate new link to recover your password",
      title: "Link Expired",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });

  const user = await User.findOne({ email: recoveryEmail.email });
  if (!user) {
    await ActivationCode.deleteOne({ codeId });
    return res.render("pages/passwordRecovery", {
      error: "The link is Invalid!",
      title: "Link Invalid",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });
  }
  return res.render("pages/passwordRecovery", {
    title: "Set Password",
    CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
    type: "setpassword",
    codeId: codeId,
    user: { name: user.name, email: user.email },
  });
};

const setPasswordRecovery = async (req, res) => {
  const {
    recoveryCode,
    pass1,
    pass2,
    "g-recaptcha-response": gcaptcha,
  } = req.body;

  const activationLink = await ActivationCode.findOne({
    codeId: recoveryCode,
    type: "recovery",
  });
  console.log(activationLink);
  if (!activationLink)
    return res.render("pages/passwordRecovery", {
      error: "Invalid recovery request, Try again",
      title: "Recover Password",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });

  const user = await User.findOne({ email: activationLink.email });
  if (!user) {
    await ActivationCode.deleteOne({ codeId });
    return res.render("pages/passwordRecovery", {
      error: "Invalid recovery request, Please try again!",
      title: "Recover Password",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "request",
    });
  }

  if (pass1 != pass2)
    return res.render("pages/passwordRecovery", {
      title: "Set Password",
      CAPTCHA_KEY: process.env.CAPTCHA_SITE_KEY,
      type: "setpassword",
      codeId: codeId,
      user: { name: user.name, email: user.email },
    });

  const hashedPassword = await bcrypt.hash(pass1, 10);
  const updateUser = await User.updateOne(
    { email: user.email },
    { $set: { password: hashedPassword } }
  );
  console.log(updateUser);
  res.clearCookie("sessionId", {
    httpOnly: true,
    sameSite: "strict",
  });

  const token = jwt.sign(user.toObject(), process.env.JWT_SECRET);
  res.cookie("sessionId", token, {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  });

  return res.redirect("/user/profile");
};

module.exports = {
  loginPage,
  loginValidate,
  newUser,
  provinceList,
  pluginLoginController,
  setPluginLogin,
  gitOAuthVerify,
  verifyActivationEmail,
  requestPasswordRecovery,
  setPasswordRecovery,
  handlePasswordRecovery,
};
