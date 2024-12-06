const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Province = require("../models/Provinces");
const PrimaryMap = require("../models/PrimaryMap");
dotenv.config();

const loginPage = async (req, res) => {
  const token = req.cookies.sessionId;
  if (!token) return res.render("pages/login");

  try {
    const user = await jwt.verify(token, process.env.JWT_SECRET);
    if (user && user.role && user.role.current) {
      if (user.role.current === "admin") {
        return res.redirect("/admin");
      } else {
        return res.redirect("/");
      }
    } else {
      return res
        .status(401)
        .render("pages/login", { error: "Invalid user role" });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).render("pages/login", { error: "Invalid session" });
  }
};

const loginValidate = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email }).lean();

  if (!user) return res.render("pages/login", { error: "Invalid Email" });

  let isMatched =
    email.toLowerCase() === process.env.ADMIN_EMAIL
      ? password === process.env.ADMIN_PASS
      : await bcrypt.compare(password, user.password);

  if (!isMatched)
    return res.render("pages/login", { error: "Invalid Password" });

  const token = await jwt.sign(user, process.env.JWT_SECRET);
  res.cookie("sessionId", token, {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: "strict",
  });

  if (user.role.current === "admin") return res.redirect("/admin");
  const primaryMap = await PrimaryMap.findOne().populate("map").lean();
  if (primaryMap?.map) return res.redirect(`/map/${primaryMap.map.id}`);
  return res.redirect("/");
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

module.exports = { loginPage, loginValidate, newUser, provinceList };
