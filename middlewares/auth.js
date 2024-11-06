const jwt = require("jsonwebtoken");
const publicRoutes = ["/home", "/"];

const authMiddleware = (req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  const token = req.cookies.sessionId;

  if (!token) {
    return res.status(401).json({ error: "No token provided, access denied" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = decoded;
    next();
  });
};

module.exports = { authMiddleware };
