const express = require("express");
const router = express.Router();
const ContactInfo = require("../models/ContactInfo");

// CREATE - Add new contact info
router.post("/", async (req, res) => {
  try {
    const newInfo = new ContactInfo(req.body);
    await newInfo.save();
    res.status(201).json(newInfo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ - Get all contact info (assuming you expect only one)
router.get("/", async (req, res) => {
  try {
    const info = await ContactInfo.findOne();
    res.status(200).json(info);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ - Get contact info by ID
router.get("/:id", async (req, res) => {
  try {
    const info = await ContactInfo.findById(req.params.id);
    if (!info) return res.status(404).json({ message: "Contact info not found" });
    res.status(200).json(info);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE - Update contact info by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedInfo = await ContactInfo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedInfo) return res.status(404).json({ message: "Contact info not found" });
    res.status(200).json({ message: "Contact info updated", data: updatedInfo });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE - Delete contact info by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedInfo = await ContactInfo.findByIdAndDelete(req.params.id);
    if (!deletedInfo) return res.status(404).json({ message: "Contact info not found" });
    res.status(200).json({ message: "Contact info deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
