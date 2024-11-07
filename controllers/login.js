const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
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
  const user = await User.findOne({ email: email });
  if (!user) return res.end("Invalid Email");
  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) return res.end("Invalid Password");
  const payload = user.toObject();
  const token = await jwt.sign(payload, process.env.JWT_SECRET);
  res.cookie("sessionId", token, {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: "strict",
  });
  if (user.role.current == "admin") return res.redirect("/admin");
  return res.redirect("/");
};

const newUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are required (name, email, password)." });
  }

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use. Please use a different email.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newuser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });
    return res
      .status(200)
      .send("Account Created Please <a href='/auth'>Login</a>");
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists. Please use a different email.",
      });
    }
    return res.status(500).json({
      status: "error",
      message:
        "An error occurred during account creation. Please try again later.",
    });
  }
};

module.exports = newUser;

module.exports = { loginPage, loginValidate, newUser };
