const express = require("express");
const router = express.Router();
const Province = require("../models/Provinces");

// Create a province
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Province name is required" });
    }
    const existingProvince = await Province.findOne({ name });
    if (existingProvince) {
      return res.status(409).json({ error: "Province already exists" });
    }
    const province = new Province({ name });
    const savedProvince = await province.save();
    res.status(201).json(savedProvince);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Delete a province
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const province = await Province.findById(id);
    if (!province) {
      return res.status(404).json({ error: "Province not found" });
    }
    await province.deleteOne();
    res.status(200).json({ message: "Province deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

module.exports = router;
