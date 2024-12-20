const ExcelJS = require("exceljs");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const archiver = require("archiver");
const unzipper = require("unzipper");
const fsExtra = require("fs-extra");
const path = require("path");

const fs = require("fs");
const User = require("../models/User");
const LoopRoute = require("../models/LoopRoute");
const Map = require("../models/Map");
const PrimaryMap = require("../models/PrimaryMap");
const Setting = require("../models/Settings");

const cleanUp = async (rawId, mapId) => {
  try {
    const primaryMap = await PrimaryMap.findOne({ map: rawId });

    if (primaryMap) {
      await primaryMap.deleteOne();
      console.log(`PrimaryMap deleted because the associated Map was deleted.`);
    }

    const deletionResult = await User.updateMany(
      { "capturedImages.mapId": mapId },
      { $pull: { capturedImages: { mapId: mapId } } }
    );
  } catch (err) {
    console.error("Error Cleanup: ", err);
  }
};

async function adminPage(req, res) {
  const user = req.user;
  if (user.role.current !== "admin") return res.end("Unauthorized!");

  const dirPath = "./public/images/mapicons/";
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Read the icons in the directory
  const icons = fs
    .readdirSync(dirPath)
    .filter((file) => fs.statSync(path.join(dirPath, file)).isFile())
    .map((file) => path.join(file));

  // Fetch users from the database
  const users = await User.find();

  // Render the admin page with the necessary data
  res.render("pages/admin", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
    users: users,
    icons: icons,
  });
}

const mongoose = require("mongoose");
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
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ status: "error", message: "Map name is required" });
  }

  try {
    const newMap = new Map({ name, id: uuidv4(), zoom: 15 });
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

const fetchPrimaryMap = async (req, res) => {
  try {
    const primaryMap = await PrimaryMap.findOne().populate("map");
    if (!primaryMap) {
      return res.status(404).json({ message: "PrimaryMap not found" });
    }
    return res.status(200).json({
      success: true,
      primaryMap,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const handlePrimaryMap = async (req, res) => {
  const { mapId } = req.body;

  try {
    const mapExists = await Map.findById(mapId);

    if (!mapExists) {
      return res.status(404).json({
        success: false,
        message: "Map with the provided ID does not exist.",
      });
    }

    let primaryMap = await PrimaryMap.findOne();

    if (primaryMap) {
      primaryMap.map = mapId;
      await primaryMap.save();
      return res.status(200).json({
        success: true,
        message: "PrimaryMap updated successfully",
        primaryMap,
      });
    } else {
      primaryMap = new PrimaryMap({
        map: mapId,
      });
      await primaryMap.save();
      return res.status(201).json({
        success: true,
        message: "PrimaryMap created successfully",
        primaryMap,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
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
        "../public",
        "images",
        marker.content
      );
      fs.unlinkSync(filePath);
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
    "..",
    "public",
    "images",
    "map_marker.png"
  );
  const MapMarker = await Setting.findOne({ name: "mapMarker" });
  if (!MapMarker) return res.sendFile(defaultImage);
  return res.sendFile(
    path.join(__dirname, "../public/images", MapMarker.content)
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

const exportImages = (req, res) => {
  const folderPath = path.join(__dirname, "../public/images/mapicons/");
  if (!fs.existsSync(folderPath)) {
    return res.status(404).send("Folder not found");
  }
  const zipFileName = "imagesBackup_" + Date.now() + ".zip";
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  res.attachment(zipFileName);

  archive.pipe(res);

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return res.status(500).send("Error reading folder");
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      // Check if it's a file and not a directory
      if (fs.statSync(filePath).isFile()) {
        archive.file(filePath, { name: file });
      }
    });

    // Finalize the archive (close it)
    archive.finalize();
  });
};

const importImages = (req, res) => {
  const filename = req.file.filename;
  const zipFilePath = path.join(__dirname, "../", filename);
  const destinationDir = path.join(__dirname, "../public/images/mapicons");

  // Check if the ZIP file exists
  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).send("ZIP file not found");
  }

  // Ensure the destination directory exists, create it if it doesn't
  try {
    fsExtra.ensureDirSync(destinationDir);
  } catch (err) {
    return res
      .status(500)
      .send(`Error ensuring destination directory: ${err.message}`);
  }

  // Create a stream to decompress the ZIP file
  const zipStream = fs.createReadStream(zipFilePath).pipe(unzipper.Parse()); // Use Parse() to handle individual files during decompression

  zipStream.on("entry", (entry) => {
    const entryPath = path.join(destinationDir, entry.path);

    // Check if the file already exists in the destination folder
    fsExtra.exists(entryPath, (exists) => {
      if (exists) {
        console.log(`Skipping existing file: ${entry.path}`);
        entry.autodrain(); // Skip the file if it already exists
      } else {
        // If the file does not exist, extract it
        entry
          .pipe(fs.createWriteStream(entryPath))
          .on("finish", () => {
            console.log(`Successfully extracted: ${entry.path}`);
          })
          .on("error", (err) => {
            console.error(
              `Error extracting file ${entry.path}: ${err.message}`
            );
          });
      }
    });
  });

  zipStream.on("close", () => {
    // Delete the original zip file after extraction
    try {
      fs.unlinkSync(zipFilePath); // Remove the zip file after extraction
      console.log(`Successfully deleted the zip file: ${zipFilePath}`);
    } catch (err) {
      console.error(`Error deleting zip file: ${err.message}`);
    }

    // Send a success response
    res.json({
      message:
        "Files have been successfully decompressed and copied to the destination folder",
    });
  });

  zipStream.on("error", (err) => {
    console.error(`Error during decompression: ${err.message}`);
    res.status(500).send(`Error during extraction: ${err.message}`);
  });
};
module.exports = {
  adminPage,
  deleteUser,
  fetchMaps,
  newMap,
  deleteMap,
  newMapMission,
  MapMissions,
  duplicateMap,
  removeMapMission,
  exportExcel,
  fetchPrimaryMap,
  handlePrimaryMap,
  changeMarker,
  getMarkerImage,
  deleteMarkerImage,
  exportImages,
  importImages,
};
