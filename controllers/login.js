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
dotenv.config();

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
        : bcrypt.compare(password, user.password);

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
        await User.deleteOne({ email: email });
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
    const codeId = uuidv4();
    const activation = await ActivationCode.create({
      email: email,
      codeId: codeId,
    });
    const html_data = `<!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Verify Your Email</title>
                          <style>
                              body {
                                  font-family: Arial, sans-serif;
                                  background-color: #f4f4f4;
                                  margin: 0;
                                  padding: 0;
                              }
                              .container {
                                  max-width: 500px;
                                  background: #ffffff;
                                  padding: 20px;
                                  margin: 30px auto;
                                  border-radius: 10px;
                                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                  text-align: center;
                              }
                              h2 {
                                  color: #333;
                              }
                              p {
                                  color: #555;
                                  font-size: 16px;
                              }
                              .button {
                                  display: inline-block;
                                  background: #007BFF;
                                  color: #ffffff;
                                  text-decoration: none;
                                  padding: 12px 20px;
                                  border-radius: 5px;
                                  font-weight: bold;
                                  margin-top: 15px;
                              }
                              .button:hover {
                                  background: #0056b3;
                              }
                              .footer {
                                  margin-top: 20px;
                                  font-size: 14px;
                                  color: #777;
                              }
                          </style>
                        </head>
                        <body>
                            <div class="container">
                                <h2>Verify Your Email Address</h2>
                                <p>Thank you for signing up on <b>UrbanEscape</b>! Please confirm your email address by clicking the button below.</p>
                                <a href="${process.env.BASE_URL}/auth/verify/${codeId}" class="button">Verify Email</a>
                                <p>If you didn’t request this, you can ignore this email.</p>
                                <p class="footer">If the button above doesn't work, copy and paste the following link in your browser:</p>
                                <p class="footer">${process.env.BASE_URL}/auth/verify/${codeId}</p>
                            </div>
                        </body>
                        </html>`;
    const info = await sendEmail(
      email,
      "UrbanEscape Account Activation",
      html_data,
      "Verify"
    );
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
      GitClientID: process.env.GIT_CLIENT_ID,
      error: "Login Failed!",
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

    const activation = await ActivationCode.findOne({ codeId: codeId });
    if (!activation)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "Invalid Verification Link!",
      });

    const user = await User.findOne({ email: activation.email });
    if (!user)
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error: "No Corresponding User Found to activate",
      });

    if (user.status == "verified")
      return res.render("pages/login", {
        GoogleClientID: process.env.GOOGLE_CLIENT_ID,
        error:
          "You are already verified, Please login using Email and password!",
      });

    try {
      await User.updateOne(
        { email: activation.email },
        { $set: { status: "verified" } }
      );
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

module.exports = {
  loginPage,
  loginValidate,
  newUser,
  provinceList,
  pluginLoginController,
  setPluginLogin,
  gitOAuthVerify,
  verifyActivationEmail,
};
