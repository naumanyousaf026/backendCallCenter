const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require("multer");
const HomePageContent = require('../models/HomePageContent');

// ===== Multer Setup for HomePage Images ===== //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../HomeImage")); // Folder for homepage images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// ===== GET all homepage sections ===== //
router.get('/home', async (req, res) => {
  try {
    const allContent = await HomePageContent.find({});
    const response = {};

    allContent.forEach(item => {
      response[item.section] = item.content;
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching homepage content', error: err });
  }
});

// ===== GET single homepage section ===== //
router.get('/home/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const content = await HomePageContent.findOne({ section });

    if (!content) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching section', error: err });
  }
});

// ===== POST: Create new homepage section ===== //
router.post('/home', async (req, res) => {
  try {
    const { section, content } = req.body;

    const exists = await HomePageContent.findOne({ section });
    if (exists) {
      return res.status(400).json({ message: 'Section already exists' });
    }

    const newSection = new HomePageContent({ section, content });
    await newSection.save();

    res.status(201).json(newSection);
  } catch (err) {
    res.status(500).json({ message: 'Error creating section', error: err });
  }
});

// ===== PUT: Update homepage section ===== //
router.put('/home/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { content } = req.body;

    const updated = await HomePageContent.findOneAndUpdate(
      { section },
      { content },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating section', error: err });
  }
});

// ===== DELETE: Remove homepage section ===== //
router.delete('/home/:section', async (req, res) => {
  try {
    const { section } = req.params;

    const deleted = await HomePageContent.findOneAndDelete({ section });

    if (!deleted) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({ message: 'Section deleted successfully', deleted });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting section', error: err });
  }
});

// ===== POST: Upload Image for homepage section ===== //
router.post('/home/upload-image/:section', upload.single('image'), async (req, res) => {
  try {
    const { section } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = `/HomeImage/${req.file.filename}`;

    const updated = await HomePageContent.findOneAndUpdate(
      { section },
      { $set: { 'content.image': imagePath } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: imagePath,
      updated,
    });
  } catch (err) {
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
});

module.exports = router;
