const express = require("express");
const port = 8000;
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");

const path = require("path");

const app = express();
connectDB();

const adminProvinceRoutes = require("./routes/province");
const staticRoutes = require("./routes/static");
const adminRoutes = require("./routes/admin");
const loginRoutes = require("./routes/login");
const userRoutes = require("./routes/user");
const apiRoutes = require("./routes/api");

const { authMiddleware, adminMiddleware } = require("./middlewares/auth");

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use("/auth", loginRoutes);
app.use("/api", apiRoutes);
app.use("/", authMiddleware, staticRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminMiddleware, adminRoutes);
app.use("/admin/province", adminMiddleware, adminProvinceRoutes);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
