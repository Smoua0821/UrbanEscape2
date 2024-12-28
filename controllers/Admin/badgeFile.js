const fs = require("fs");
const path = require("path");
const Badge = require("../../models/Badges");

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

    fs.promises.rm(dirPath, { recursive: true });

    await Badge.deleteMany({ dir: name });
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

const setDescription = async (req, res) => {
  try {
    const { dir, file, description } = req.body;

    // Check if the necessary parameters are provided
    if (!dir || !file || !description) {
      return res.status(400).json({
        status: "error",
        message: "Missing required arguments: 'dir', 'file', or 'description'",
      });
    }

    // Define the pathname (although it's not used in the update, it's included for context)
    const pathname = `${dir}/${file}`;

    // Attempt to update the badge description in the database
    const updateResult = await Badge.updateOne(
      { dir, file },
      { $set: { description } },
      { upsert: true }
    );

    // Successfully updated or created a new document
    return res.status(200).json({
      status: "success",
      message: "Description updated successfully.",
      data: updateResult,
    });
  } catch (error) {
    console.error("Error updating description:", error);

    // Catch any other unexpected errors
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

const getDescription = async (req, res) => {
  try {
    const { dir, file } = req.query;
    if (!dir || !file) {
      return res.status(400).json({
        status: "error",
        message: "Missing required query parameters: 'dir' and 'file'",
      });
    }
    const data = await Badge.findOne({ dir, file });

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: `No badge found for dir: ${dir} and file: ${file}`,
      });
    }
    return res.status(200).json({
      status: "success",
      description: data.description,
    });
  } catch (error) {
    console.error("Error fetching description:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

module.exports = {
  dirCreate,
  getDirs,
  deleteDir,
  getFiles,
  deleteFile,
  getDescription,
  setDescription,
};
