const ExcelJS = require("exceljs");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const archiver = require("archiver");
const unzipper = require("unzipper");
const fsExtra = require("fs-extra");
const path = require("path");

const fs = require("fs");
const User = require("../../models/User");
const LoopRoute = require("../../models/LoopRoute");
const Map = require("../../models/Map");
const Setting = require("../../models/Settings");

const cleanUp = async (rawId, mapId) => {
  try {
    const deletionResult = await User.updateMany(
      { "capturedImages.mapId": mapId },
      { $pull: { capturedImages: { mapId: mapId } } }
    );

    const filePath = `public/images/map_countdown/${mapId}.jpg`;

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return;
      }
      console.log("File deleted successfully");
    });
  } catch (err) {
    console.error("Error Cleanup: ", err);
  }
};

async function adminPage(req, res) {
  try {
    const user = req.user;
    if (user.role.current !== "admin")
      return res.status(403).end("Unauthorized!");

    const dirPath = path.join(__dirname, "../../public/images/mapicons/");
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (err) {
        console.log(err);
        return res.status(500).end("Failed to create directory.");
      }
    }

    let icons = [];
    try {
      icons = fs
        .readdirSync(dirPath)
        .filter((file) => fs.statSync(path.join(dirPath, file)).isFile())
        .map((file) => path.join(file));
    } catch (err) {
      return res.status(500).end("Failed to read directory.");
    }

    let users = [];
    try {
      users = await User.find();
    } catch (err) {
      return res.status(500).end("Failed to fetch users from the database.");
    }

    return res.render("pages/admin", {
      apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
      users: users,
      icons: icons,
    });
  } catch (err) {
    return res.status(500).end("An unexpected error occurred.");
  }
}

const mongoose = require("mongoose");
const Settings = require("../../models/Settings");
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid user ID format",
    });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    await User.deleteOne({ _id: id });

    return res.json({
      status: "success",
      message: `${user.name} deleted successfully`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message || error,
    });
  }
};

const fetchMaps = async (req, res) => {
  const maps = await Map.find({});
  let message;
  if (!maps) message = "No Map Found, Please Create New!";
  message = `success`;
  return res.status(200).json({
    message: message,
    maps: maps,
  });
};
const newMap = async (req, res) => {
  const { name, mapLaunchTime, mapLaunchDate } = req.body;

  if (!name || !mapLaunchTime || !mapLaunchDate) {
    return res
      .status(400)
      .json({ status: "error", message: "Map name is required" });
  }
  let ISODate = new Date(`${mapLaunchDate}T${mapLaunchTime}`);
  ISODate = ISODate.toISOString();

  try {
    const uniqueId = uuidv4();
    const newMap = new Map({
      name,
      id: uniqueId,
      zoom: 15,
      launchTime: ISODate,
    });

    const destinationFile = `public/images/map_countdown/${uniqueId}.jpg`;
    fs.copyFile(
      "public/images/map_countdown/default.jpg",
      destinationFile,
      (err) => {
        if (err) {
          console.error("Error copying file:", err);
        } else {
          console.log(
            `File copied and renamed to "${destinationFile}" successfully!`
          );
        }
      }
    );
    const savedMap = await newMap.save();
    res
      .status(201)
      .json({ status: "success", message: "Map created", data: savedMap });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create map",
      error: error.message,
    });
  }
};

const deleteMap = async (req, res) => {
  const { mapId } = req.body;
  if (!mapId)
    return res.status(404).json({ status: "error", message: "No Map Found" });

  try {
    const map = await Map.findOne({ id: mapId });
    if (!map)
      return res.status(404).json({ status: "error", message: "No Map Found" });
    await Map.deleteOne({ id: mapId });
    await LoopRoute.deleteMany({ mapId: map._id });
    cleanUp(map._id, mapId);
    return res
      .status(200)
      .status(200)
      .json({
        status: "success",
        message: `Map '${map.name}' Deleted Successfully!`,
      });
  } catch (error) {
    return res
      .status(401)
      .json({ status: "error", message: "Something went Wrong" });
  }
};

const newMapMission = async (req, res) => {
  const { mapId, missions } = req.body;
  if (!mapId || !missions)
    return res
      .status(400)
      .json({ status: "error", message: "Invalid Request" });

  try {
    const map = await Map.findOne({ id: mapId });
    if (!map)
      return res.status(404).json({ status: "error", message: "No Map Found" });

    const missionsExist = map.missions || [];

    if (missionsExist.includes(missions)) {
      return res
        .status(409)
        .json({ status: "error", message: "Duplicate Mission" });
    }

    if (missionsExist.find((me) => me.name === missions.name))
      return res.status(409).json({
        status: "error",
        message: `${missions.name} Already used, Try Different Name`,
      });

    missionsExist.push(missions);

    await Map.updateOne({ id: mapId }, { $set: { missions: missionsExist } });
    return res.status(200).json({
      status: "success",
      message: "Mission Added",
      data: missionsExist,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Server Error" });
  }
};

const removeMapMission = async (req, res) => {
  try {
    const { mapId, missionId } = req.body;
    if (!mapId || !missionId)
      return res
        .status(400)
        .json({ status: "error", message: "Missing Required Arguments!" });

    const map = await Map.findOne({ id: mapId });
    if (!map)
      return res
        .status(404)
        .json({ status: "error", message: "Map not Found!" });

    if (!Array.isArray(map.missions) || map.missions.length === 0)
      return res.status(204).json({
        status: "success",
        message: `No missions to delete for ${map.name}`,
      });

    const updatedMissions = map.missions.filter(
      (d) => d._id.toString() !== missionId
    );
    await Map.updateOne({ id: mapId }, { $set: { missions: updatedMissions } });

    return res.json({
      status: "success",
      message: "Mission Deleted Successfully!",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Server Error", error: error.message });
  }
};

const MapMissions = async (req, res) => {
  const { mapId } = req.query;
  if (!mapId)
    return res
      .status(400)
      .json({ status: "error", message: "Invalid Request" });

  try {
    const map = await Map.findOne({ id: mapId });
    if (!map)
      return res.status(404).json({ status: "error", message: "No Map Found" });

    return res.json({ missions: map.missions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something Went Wrong!" });
  }
};

const duplicateMap = async (req, res) => {
  const { name, id } = req.body;

  if (!name || !id) {
    return res.status(400).json({ message: "Missing Required Parameters!" });
  }

  try {
    const map = await Map.findOne({ id: id });

    if (!map) {
      return res.status(404).json({ message: "No Map Found to duplicate!" });
    }

    const newMap = map.toObject();
    newMap.name = name;
    newMap._id = undefined;
    newMap.id = uuidv4();
    newMap.createdAt = undefined;
    newMap.updatedAt = undefined;
    newMap.missions.forEach((d) => {
      d._id = undefined;
    });

    const duplicatedMap = new Map(newMap);
    const savedMap = await duplicatedMap.save();

    const routes = await LoopRoute.find({ mapId: map._id });

    if (routes && routes.length > 0) {
      for (const rout of routes) {
        const route = rout.toObject();
        route._id = undefined;
        route.mapId = savedMap._id;
        route.createdAt = undefined;
        route.updatedAt = undefined;

        const duplicateRoute = new LoopRoute(route);

        try {
          const savedRoute = await duplicateRoute.save(); // Save the duplicated route
          console.log(savedRoute); // Log the saved route
        } catch (error) {
          console.error("Error saving duplicated route:", error);
        }
      }
    }

    return res.status(200).json(savedMap);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    } else if (err.name === "ValidationError") {
      return res
        .status(422)
        .json({ message: "Validation Error", error: err.message });
    } else {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: err.message });
    }
  }
};

const exportExcel = async (req, res) => {
  try {
    const users = await User.find({});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "province", key: "province", width: 10 },
      { header: "role", key: "role", width: 10 },
      { header: "since", key: "since", width: 10 },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        name: user.name,
        email: user.email,
        province: user.state,
        role: user.role.current,
        since: moment(user.createdAt).format("MM/DD/YYYY"),
      });
    });

    const filename = `users_${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error generating Excel file:", err);
    res.status(500).send("Error generating Excel file");
  }
};

const changeMarker = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const randomFilename = req.file.filename;
    const marker = await Setting.findOneAndDelete({ name: "mapMarker" });

    if (marker) {
      const filePath = path.join(
        __dirname,
        "../../public",
        "images",
        marker.content
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await Setting.create({ name: "mapMarker", content: randomFilename });

    return res.json({
      status: "success",
      filename: randomFilename,
      message: "Marker Updated Successfully!",
    });
  } catch (err) {
    console.error("Error updating marker:", err);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating the marker.",
      error: err.message,
    });
  }
};

const getMarkerImage = async (req, res) => {
  const defaultImage = path.join(
    __dirname,
    "../..",
    "public",
    "images",
    "map_marker.png"
  );
  const MapMarker = await Setting.findOne({ name: "mapMarker" });
  if (!MapMarker) return res.sendFile(defaultImage);
  return res.sendFile(
    path.join(__dirname, "../../public/images", MapMarker.content)
  );
};

const deleteMarkerImage = async (req, res) => {
  try {
    const marker = await Setting.findOneAndDelete({ name: "mapMarker" });

    if (!marker) {
      return res.json({ message: "No Marker Exists" });
    }

    const markerImagePath = path.join(
      __dirname,
      "../public/images",
      marker.content
    );

    // Check if the file exists before attempting to delete it
    if (fs.existsSync(markerImagePath)) {
      fs.unlinkSync(markerImagePath);
      return res.json({ message: "Marker set to Default!" });
    } else {
      return res.json({
        message: "Marker image not found, skipping deletion.",
      });
    }
  } catch (error) {
    console.error("Error deleting marker image:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while deleting the marker image." });
  }
};

const exportDir = (folderPath, zipFileName, res) => {
  if (!fs.existsSync(folderPath)) {
    return res.status(404).send("Folder not found");
  }

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  res.attachment(zipFileName);
  archive.pipe(res);

  // Recursively add files to the archive
  const addFilesToArchive = (currentPath, archiveBasePath) => {
    const files = fs.readdirSync(currentPath);

    files.forEach((file) => {
      const filePath = path.join(currentPath, file);
      const relativePath = path.join(archiveBasePath, file);

      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // If it's a directory, recursively add its contents
        addFilesToArchive(filePath, relativePath);
      } else {
        // If it's a file, add it to the archive
        archive.file(filePath, { name: relativePath });
      }
    });
  };

  try {
    // Start adding files from the root directory
    addFilesToArchive(folderPath, path.basename(folderPath));

    // Finalize the archive (close it)
    archive.finalize();
  } catch (err) {
    return res.status(500).send("Error processing folder: " + err.message);
  }
};

const exportImages = (req, res) => {
  const folderPath = path.join(__dirname, "../../public/images/mapicons/");
  const zipFileName = "imagesBackup_" + Date.now() + ".zip";
  exportDir(folderPath, zipFileName, res);
};

const exportBadges = (req, res) => {
  const folderPath = path.join(__dirname, "../../public/badges/");
  const zipFileName = "badgeBackup_" + Date.now() + ".zip";
  exportDir(folderPath, zipFileName, res);
};

const importDir = (zipFilePath, destinationDir, type, res) => {
  const allowedType = ["directory", "files"];
  if (!allowedType.includes(type))
    return res.status(400).json({ status: "error", message: "Not Allowed!" });

  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).send("ZIP file not found");
  }

  try {
    fsExtra.ensureDirSync(destinationDir); // Ensure the destination directory exists
  } catch (err) {
    return res
      .status(500)
      .send(`Error ensuring destination directory: ${err.message}`);
  }

  const zipStream = fs.createReadStream(zipFilePath).pipe(unzipper.Parse());

  let badgesDirFound = false; // Flag to check if 'badges' directory exists

  zipStream.on("entry", (entry) => {
    // Check if the entry's path starts with 'badges/' (case-sensitive)
    if (entry.path.startsWith("badges/") || type == "files") {
      badgesDirFound = true;
    }

    // If 'badges' directory was found, proceed with extraction
    if (badgesDirFound) {
      const entryPath = path.join(destinationDir, entry.path);

      if (type === "files") {
        // If the type is 'files', ensure entry is a file and not a directory
        if (entry.type !== "File") {
          console.log(
            `Skipping directory (expected files only): ${entry.path}`
          );
          entry.autodrain();
        } else {
          // Extract the file
          entry
            .pipe(fs.createWriteStream(entryPath))
            .on("finish", () => {
              console.log(`Successfully extracted file: ${entry.path}`);
            })
            .on("error", (err) => {
              console.error(
                `Error extracting file ${entry.path}: ${err.message}`
              );
            });
        }
      }

      if (type === "directory") {
        // If the type is 'directory', we need to preserve the directory structure
        if (entry.type === "Directory") {
          const dirPath = path.join(destinationDir, entry.path);
          fsExtra.ensureDirSync(dirPath); // Ensure the directory structure is preserved
          entry.autodrain();
        } else if (entry.type === "File") {
          // Ensure the directory structure exists before writing the file
          const dirPath = path.dirname(entryPath);
          fsExtra.ensureDirSync(dirPath);
          entry
            .pipe(fs.createWriteStream(entryPath))
            .on("finish", () => {
              console.log(`Successfully extracted file: ${entry.path}`);
            })
            .on("error", (err) => {
              console.error(
                `Error extracting file ${entry.path}: ${err.message}`
              );
            });
        }
      }
    } else {
      // If 'badges' is not found in the ZIP, skip all extraction
      console.log("Skipping extraction because 'badges' directory is missing.");
      entry.autodrain();
    }
  });

  zipStream.on("close", () => {
    try {
      fs.unlinkSync(zipFilePath); // Delete the zip file after extraction
      console.log(`Successfully deleted the zip file: ${zipFilePath}`);
    } catch (err) {
      console.error(`Error deleting zip file: ${err.message}`);
    }

    if (badgesDirFound) {
      res.json({
        message:
          "Files have been successfully decompressed and copied to the destination folder",
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "'badges' directory not found in the ZIP file",
      });
    }
  });

  zipStream.on("error", (err) => {
    console.error(`Error during decompression: ${err.message}`);
    res.status(500).send(`Error during extraction: ${err.message}`);
  });
};

const importImages = (req, res) => {
  const filename = req.file.filename;
  const zipFilePath = path.join(__dirname, "../../", filename);
  const destinationDir = path.join(__dirname, "../../public/images");
  importDir(zipFilePath, destinationDir, "files", res);
};

const importBadges = (req, res) => {
  const filename = req.file.filename;
  const zipFilePath = path.join(__dirname, "../../", filename);
  const destinationDir = path.join(__dirname, "../../public");
  importDir(zipFilePath, destinationDir, "directory", res);
};

const settingsImport = async (req, res) => {
  try {
    const settings = await Settings.find({});
    if (!settings)
      return res.status(404).json({ status: "error", message: "Not found" });
    return res.json(settings);
  } catch (error) {
    console.log(error);
    return res
      .status(403)
      .json({ status: "error", message: "Some Error Occured!" });
  }
};

const settingsUpdate = async (req, res) => {
  const allowedSettings = [
    "mapMarkerSize",
    "congratsText",
    "captureBtnTextInput",
    "loginTextInput",
  ];
  const { name, value } = req.body;

  if (!name || !value) {
    return res
      .status(400)
      .json({ status: "error", message: "No Argument found!" });
  }

  if (!allowedSettings.includes(name)) {
    return res
      .status(400)
      .json({ status: "error", message: "Argument not Allowed!" });
  }

  try {
    const updatedSetting = await Setting.findOneAndUpdate(
      { name },
      { content: value },
      { new: true, upsert: true }
    );

    return res.status(updatedSetting ? 200 : 201).json({
      status: "success",
      message: updatedSetting
        ? "Setting updated successfully!"
        : "Setting created successfully!",
      setting: updatedSetting,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error", error });
  }
};

const updateMapDate = async (req, res) => {
  const { id, mapLaunchTime, mapLaunchDate } = req.body;
  if (!id || !mapLaunchTime || !mapLaunchDate) {
    return res
      .status(400)
      .json({ status: "error", message: "Map Arguments are required!" });
  }
  let ISODate = new Date(`${mapLaunchDate}T${mapLaunchTime}`);
  ISODate = ISODate.toISOString();
  if (!ISODate)
    return res.status(400).json({ status: "error", message: "Invalid Date!" });

  try {
    await Map.updateOne({ id: id }, { $set: { launchTime: ISODate } });
    return res
      .status(200)
      .json({ status: "success", message: "Date Updated!" });
  } catch (error) {
    console.log(error);
    return res.status(401).json({ status: "error", message: "Server Error!" });
  }
};

module.exports = {
  adminPage,
  deleteUser,
  fetchMaps,
  newMap,
  updateMapDate,
  deleteMap,
  newMapMission,
  MapMissions,
  duplicateMap,
  removeMapMission,
  exportExcel,
  changeMarker,
  getMarkerImage,
  deleteMarkerImage,
  exportImages,
  exportBadges,
  importImages,
  importBadges,
  settingsImport,
  settingsUpdate,
};
