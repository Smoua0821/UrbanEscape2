const jwt = require("jsonwebtoken");
const publicRoutes = ["/", "/home", "/privacy-policy", "/marker"];

const authMiddleware = (req, res, next) => {
  if (publicRoutes.includes(req.path) || req.path.startsWith("/map/")) {
    const token = req.cookies.sessionId;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          res.clearCookie("sessionId", {
            httpOnly: true,
            sameSite: "strict",
          });
          return res.redirect("/");
        }
        req.user = decoded;
      });
    }
    return next();
  }
  const token = req.cookies.sessionId;

  if (!token) {
    return res.status(301).redirect("/auth");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.clearCookie("sessionId", {
        httpOnly: true,
        sameSite: "strict",
      });
      return res.redirect("/");
    }

    req.user = decoded;
    next();
  });
};

const adminMiddleware = async (req, res, next) => {
  if (req.user.role.current == "admin") return next();
  return res.status(404).json({ status: "error", message: "Invalid Request" });
};

module.exports = { authMiddleware, adminMiddleware };
