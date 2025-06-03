const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require("multer");
const BlogContent = require('../models/BlogPageContent');

// ===== Multer Setup ===== //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../blogImages"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ===== GET all blog sections ===== //
router.get('/', async (req, res) => {
  try {
    const allContent = await BlogContent.find({});
    const response = {};

    allContent.forEach(item => {
      response[item.section] = item.content;
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching content', error: err });
  }
});

// ===== GET single section ===== //
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const content = await BlogContent.findOne({ section });

    if (!content) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching section', error: err });
  }
});

// ===== POST new section ===== //
router.post('/', async (req, res) => {
  try {
    const { section, content } = req.body;

    const exists = await BlogContent.findOne({ section });
    if (exists) {
      return res.status(400).json({ message: 'Section already exists' });
    }

    const newSection = new BlogContent({ section, content });
    await newSection.save();

    res.status(201).json(newSection);
  } catch (err) {
    res.status(500).json({ message: 'Error creating section', error: err });
  }
});

// ===== PUT update section ===== //
router.put('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { content } = req.body;

    const updated = await BlogContent.findOneAndUpdate(
      { section },
      { content },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating section', error: err });
  }
});

// ===== DELETE section ===== //
router.delete('/:section', async (req, res) => {
  try {
    const { section } = req.params;

    const deleted = await BlogContent.findOneAndDelete({ section });

    if (!deleted) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({ message: 'Section deleted successfully', deleted });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting section', error: err });
  }
});

// ===== POST: Upload Image ===== //
router.post('/upload-image/:section', upload.single('image'), async (req, res) => {
  try {
    const { section } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = `Image/${req.file.filename}`;

    const updated = await BlogContent.findOneAndUpdate(
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
