const express = require("express");
const app = express();
const port = 8000;
const path = require("path");

const staticRoutes = require("./routes/static");
const adminRoutes = require("./routes/admin");

app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use("/", staticRoutes);
app.use("/admin", adminRoutes);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
