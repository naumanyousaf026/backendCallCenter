const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require("multer");
const fs = require("fs");
const AboutPageContent = require('../models/AboutPageContent');

// === Multer setup === //
const uploadDir = path.join(__dirname, "../uploads/aboutus/");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// === Get All Sections === //
router.get('/', async (req, res) => {
  try {
    const allContent = await AboutPageContent.find({});
    const response = {};

    allContent.forEach(item => {
      response[item.section] = item.content;
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching content', error: err });
  }
});

// === Get Single Section === //
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const content = await AboutPageContent.findOne({ section });

    if (!content) return res.status(404).json({ message: 'Section not found' });

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching section', error: err });
  }
});

// === Create New Section === //
router.post('/', async (req, res) => {
  try {
    const { section, content } = req.body;

    const exists = await AboutPageContent.findOne({ section });
    if (exists) return res.status(400).json({ message: 'Section already exists' });

    const newSection = new AboutPageContent({ section, content });
    await newSection.save();

    res.status(201).json(newSection);
  } catch (err) {
    res.status(500).json({ message: 'Error creating section', error: err });
  }
});

// === Update Section === //
router.put('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { content } = req.body;

    const updated = await AboutPageContent.findOneAndUpdate(
      { section },
      { content },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating section', error: err });
  }
});

// === Delete Section === //
router.delete('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const deleted = await AboutPageContent.findOneAndDelete({ section });

    if (!deleted) return res.status(404).json({ message: 'Section not found' });

    res.json({ message: 'Deleted successfully', deleted });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting section', error: err });
  }
});

// === Upload Image to Section === //
router.post('/upload-image/:section', upload.single('image'), async (req, res) => {
  try {
    const { section } = req.params;
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const imagePath = `/uploads/aboutus/${req.file.filename}`;

    const updated = await AboutPageContent.findOneAndUpdate(
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
