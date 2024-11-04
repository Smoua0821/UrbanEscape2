const express = require("express");
const port = 8000;
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const path = require("path");

const app = express();
connectDB();

const staticRoutes = require("./routes/static");
const adminRoutes = require("./routes/admin");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use("/", staticRoutes);
app.use("/admin", adminRoutes);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
