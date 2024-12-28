const fs = require("fs");
const path = require("path");

const dirCreate = async (req, res) => {
  let { name } = req.body;
  if (!name)
    return res.json({ status: "error", message: "Arguments Required" });

  const dirPath = path.join(
    __dirname,
    "../../public/badges",
    name.toUpperCase()
  );

  try {
    if (fs.existsSync(dirPath)) {
      return res.json({ status: "error", message: "Directory already exists" });
    }

    fs.mkdirSync(dirPath, { recursive: true });
    return res.json({
      status: "success",
      message: "Directory created successfully",
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: "Error creating directory",
      error: error.message,
    });
  }
};

const getDirs = async (req, res) => {
  const dirPath = path.join(__dirname, "../../public/badges");
  try {
    const fullPath = path.resolve(__dirname, dirPath);

    if (!fs.existsSync(fullPath))
      return res.json({ status: "error", message: "Directory not found" });

    const items = fs.readdirSync(fullPath);
    const directories = items.filter((item) =>
      fs.statSync(path.join(fullPath, item)).isDirectory()
    );

    return res.json({ status: "success", directories });
  } catch (error) {
    return res.json({
      status: "error",
      message: "Error reading directories",
      error: error.message,
    });
  }
};

const deleteDir = async (req, res) => {
  const { name } = req.body;
  if (!name)
    return res.json({ status: "error", message: "Directory name is required" });

  const dirPath = path.join(__dirname, "../../public/badges", name);

  try {
    if (!fs.existsSync(dirPath))
      return res.json({ status: "error", message: "Directory does not exist" });

    fs.rmdir(dirPath, { recursive: true });
    return res.json({
      status: "success",
      message: "Directory deleted successfully",
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: "Error deleting directory",
      error: error.message,
    });
  }
};

const getFiles = async (req, res) => {
  const { dirName } = req.body;
  if (!dirName)
    return res.json({ status: "error", message: "Directory name is required" });

  const dirPath = path.join(__dirname, "../../public/badges", dirName);

  try {
    if (!fs.existsSync(dirPath))
      return res.json({ status: "error", message: "Directory does not exist" });

    const files = fs
      .readdirSync(dirPath)
      .filter((item) => fs.statSync(path.join(dirPath, item)).isFile());
    return res.json({ status: "success", files });
  } catch (error) {
    return res.json({
      status: "error",
      message: "Error fetching files",
      error: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  const { dirName, filename } = req.body;
  if (!dirName || !filename)
    return res.json({
      status: "error",
      message: "Directory name and filename are required",
    });

  const dirPath = path.join(__dirname, "../../public/badges", dirName);
  const filePath = path.join(dirPath, filename);

  try {
    if (!fs.existsSync(dirPath))
      return res.json({ status: "error", message: "Directory does not exist" });

    if (!fs.existsSync(filePath))
      return res.json({ status: "error", message: "File does not exist" });

    fs.unlinkSync(filePath);
    return res.json({
      status: "success",
      message: "File deleted successfully",
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: "Error deleting file",
      error: error.message,
    });
  }
};

module.exports = { dirCreate, getDirs, deleteDir, getFiles, deleteFile };
