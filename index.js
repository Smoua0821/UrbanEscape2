const express = require("express");
const port = 8000;
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const path = require("path");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();
connectDB(); // Assuming this is your DB connection

app.use(mongoSanitize());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Import route modules
const adminProvinceRoutes = require("./routes/province");
const staticRoutes = require("./routes/static");
const adminRoutes = require("./routes/Admin/admin");
const adminButtonRoutes = require("./routes/Admin/buttons");
const adminBadgeRoutes = require("./routes/Admin/badgeFile");
const adminUserRoutes = require("./routes/Admin/user");
const loginRoutes = require("./routes/login");
const userRoutes = require("./routes/user");
const gameRoutes = require("./routes/game");
const apiRoutes = require("./routes/api");

const { authMiddleware, adminMiddleware } = require("./middlewares/auth");
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/auth", loginRoutes);
app.use("/api", apiRoutes);
app.use("/", authMiddleware, staticRoutes);
app.use("/user", userRoutes);
app.use("/game", gameRoutes);
app.use("/admin", adminMiddleware, adminRoutes);
app.use("/admin/button", adminMiddleware, adminButtonRoutes);
app.use("/admin/badges", adminMiddleware, adminBadgeRoutes);
app.use("/admin/user", adminMiddleware, adminUserRoutes);
app.use("/admin/province", adminMiddleware, adminProvinceRoutes);
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
