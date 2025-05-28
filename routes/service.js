const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require("multer");
const ServicesContent = require('../models/ServicesPageContent');

// ===== Multer Setup ===== //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../ServiceImage"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ===== GET all sections (Read) ===== //
router.get('/services', async (req, res) => {
  try {
    const allContent = await ServicesContent.find({});
    const response = {};

    allContent.forEach(item => {
      response[item.section] = item.content;
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching content', error: err });
  }
});

// ===== GET single section (optional but useful) ===== //
router.get('/services/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const content = await ServicesContent.findOne({ section });

    if (!content) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching section', error: err });
  }
});

// ===== POST: Create new section (Create) ===== //
router.post('/', async (req, res) => {
  try {
    const { section, content } = req.body;

    const exists = await ServicesContent.findOne({ section });
    if (exists) {
      return res.status(400).json({ message: 'Section already exists' });
    }

    const newSection = new ServicesContent({ section, content });
    await newSection.save();

    res.status(201).json(newSection);
  } catch (err) {
    res.status(500).json({ message: 'Error creating section', error: err });
  }
});

// ===== PUT: Update section (Update) ===== //
router.put('/services/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { content } = req.body;

    const updated = await ServicesContent.findOneAndUpdate(
      { section },
      { content },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating section', error: err });
  }
});

// ===== DELETE: Remove a section (Delete) ===== //
router.delete('/services/:section', async (req, res) => {
  try {
    const { section } = req.params;

    const deleted = await ServicesContent.findOneAndDelete({ section });

    if (!deleted) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({ message: 'Section deleted successfully', deleted });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting section', error: err });
  }
});

// ===== POST: Upload Image for section ===== //
router.post('/services/upload-image/:section', upload.single('image'), async (req, res) => {
  try {
    const { section } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = `/ServiceImage/${req.file.filename}`;

    const updated = await ServicesContent.findOneAndUpdate(
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
