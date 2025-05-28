const express = require("express");
const router = express.Router();
const ClientStat = require("../models/ClientStat");

// Create a new stat
router.post("/", async (req, res) => {
  try {
    const newStat = new ClientStat(req.body);
    await newStat.save();
    res.status(201).json(newStat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all stats
router.get("/", async (req, res) => {
  try {
    const stats = await ClientStat.find();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single stat by ID
router.get("/:id", async (req, res) => {
  try {
    const stat = await ClientStat.findById(req.params.id);
    if (!stat) return res.status(404).json({ message: "Stat not found" });
    res.status(200).json(stat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a stat by ID
router.put("/:id", async (req, res) => {
  try {
    const stat = await ClientStat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!stat) return res.status(404).json({ message: "Stat not found" });
    res.status(200).json(stat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a stat by ID
router.delete("/:id", async (req, res) => {
  try {
    const stat = await ClientStat.findByIdAndDelete(req.params.id);
    if (!stat) return res.status(404).json({ message: "Stat not found" });
    res.status(200).json({ message: "Stat deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
