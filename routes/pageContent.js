const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const PageContent = require('../models/PageContent');
const verifyAdminToken = require('../middleware/adminAuthMiddleware'); // admin middleware

// ===== Create uploads directory if it doesn't exist ===== //
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ===== Multer Setup with size limits ===== //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ===== IMAGE UPLOAD ENDPOINT ===== //
router.post('/upload-image', verifyAdminToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// ===== MULTIPLE IMAGES UPLOAD ===== //
router.post('/upload-images', verifyAdminToken, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const uploadedImages = req.files.map(file => ({
      imageUrl: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size
    }));
    
    res.json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Images upload error:', error);
    res.status(500).json({ message: 'Error uploading images', error: error.message });
  }
});

// ===== GET ALL CONTENT (Public) ===== //
router.get('/', async (req, res) => {
  try {
    const allContent = await PageContent.find({}).sort({ page: 1, section: 1 });
    res.json(allContent);
  } catch (err) {
    console.error('Error fetching all content:', err);
    res.status(500).json({ message: 'Error fetching all content', error: err.message });
  }
});

// GET all content for a specific page (Public)
router.get('/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const data = await PageContent.find({ page });

    const response = {};
    data.forEach(item => {
      response[item.section] = item.content;
    });

    res.json(response);
  } catch (err) {
    console.error('Error fetching page content:', err);
    res.status(500).json({ message: 'Error fetching page content', error: err.message });
  }
});

// GET specific section from a page (Public)
router.get('/:page/:section', async (req, res) => {
  try {
    const { page, section } = req.params;
    const item = await PageContent.findOne({ page, section });

    if (!item) return res.status(404).json({ message: 'Section not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching section:', err);
    res.status(500).json({ message: 'Error fetching section', error: err.message });
  }
});

// CREATE section (Admin only)
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { page, section, content } = req.body;
    const exists = await PageContent.findOne({ page, section });

    if (exists) return res.status(400).json({ message: 'Section already exists' });

    const newItem = new PageContent({ page, section, content });
    await newItem.save();

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating section:', err);
    res.status(500).json({ message: 'Error creating section', error: err.message });
  }
});

// UPDATE section (Admin only)
router.put('/:page/:section', verifyAdminToken, async (req, res) => {
  try {
    const { page, section } = req.params;
    const { content } = req.body;

    // Check content size (should be much smaller now with image URLs)
    const contentSize = JSON.stringify(content).length;
    if (contentSize > 5000000) { // 5MB limit for JSON content
      return res.status(413).json({ 
        message: 'Content is too large. Please use image URLs instead of base64 data.' 
      });
    }

    const updated = await PageContent.findOneAndUpdate(
      { page, section },
      { content, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Error updating section:', err);
    if (err.name === 'DocumentTooLarge') {
      res.status(413).json({ 
        message: 'Document is too large for MongoDB. Please reduce content size.' 
      });
    } else {
      res.status(500).json({ message: 'Error updating section', error: err.message });
    }
  }
});

// DELETE section (Admin only)
router.delete('/:page/:section', verifyAdminToken, async (req, res) => {
  try {
    const { page, section } = req.params;

    const deleted = await PageContent.findOneAndDelete({ page, section });

    if (!deleted) return res.status(404).json({ message: 'Section not found' });

    res.json({ message: 'Section deleted successfully', deleted });
  } catch (err) {
    console.error('Error deleting section:', err);
    res.status(500).json({ message: 'Error deleting section', error: err.message });
  }
});

// ===== DELETE IMAGE FILE ===== //
router.delete('/image/:filename', verifyAdminToken, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image file not found' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

module.exports = router;