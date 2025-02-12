const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const Province = require("../models/Provinces");
const PrimaryMap = require("../models/PrimaryMap");

dotenv.config();

const loginPage = async (req, res) => {
  const token = req.cookies.sessionId;
  if (!token)
    return res.render("pages/login", {
      GoogleClientID: process.env.GOOGLE_CLIENT_ID,
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
        error: "Invalid user role",
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
      });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).render("pages/login", { error: "Invalid session" });
  }
};

const loginValidate = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).lean();

    if (!user) return res.render("pages/login", { error: "Invalid Email" });

    let isMatched =
      email.toLowerCase() === process.env.ADMIN_EMAIL
        ? password === process.env.ADMIN_PASS
        : await bcrypt.compare(password, user.password);

    if (!isMatched)
      return res.render("pages/login", { error: "Invalid Password" });

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
      error: "Something went wrong, please try again later.",
    });
  }
};

const newUser = async (req, res) => {
  const { name, email, password, state, ppolicy } = req.body;

  if (!ppolicy)
    return res.render("pages/login", {
      error: "Privacy Policy must be accepted!",
    });

  if (!name || !email || !password || !state) {
    return res.status(400).render("pages/postRegister", {
      message: "All fields are required",
      type: "danger",
    });
  }

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).render("pages/postRegister", {
        message: "Email already in use. Please use a different email.",
        type: "danger",
        user: existingUser,
      });
    }
    const province = await Province.findOne({ name: state });
    if (!province)
      return res.render("pages/login", { error: "Invalid State Choosen" });
    const hashedPassword = await bcrypt.hash(password, 10);

    const newuser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      state: state,
    });
    return res.status(200).render("pages/postRegister", {
      message: "Account Created Successfully!",
      type: "success",
      user: newuser,
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).render("pages/postRegister", {
        type: "danger",
        message: "Email already exists. Please use a different email.",
      });
    }
    return res.status(500).render("pages/postRegister", {
      type: "danger",
      message:
        "An error occurred during account creation. Please try again later.",
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
        });
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
  if (!token) return res.render("pages/login", { error: "Login Failed!" });
  return res
    .cookie("sessionId", token, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    })
    .redirect("/");
};

module.exports = {
  loginPage,
  loginValidate,
  newUser,
  provinceList,
  pluginLoginController,
  setPluginLogin,
};
