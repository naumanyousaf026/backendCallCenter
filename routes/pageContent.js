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

// CREATE section (Admin only) - supports both JSON and FormData
router.post('/', verifyAdminToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'senderImage', maxCount: 1 }
]), async (req, res) => {
  try {
    let { page, section, content } = req.body;
    
    // If content is a string (from FormData), parse it
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        // If parsing fails, treat as plain text
      }
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        content.imageUrl = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.senderImage && req.files.senderImage[0]) {
        content.senderImageUrl = `/uploads/${req.files.senderImage[0].filename}`;
      }
    }

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

// UPDATE section (Admin only) - Simplified version
router.put('/:page/:section', verifyAdminToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'senderImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { page, section } = req.params;
    
    // Get the existing document
    const existingDoc = await PageContent.findOne({ page, section });
    
    // Initialize content - preserve existing content if it exists
    let updatedContent = existingDoc ? { ...existingDoc.content } : {};
    
    // Handle JSON content from body
    if (req.body && Object.keys(req.body).length > 0) {
      // If content is sent as a JSON string (from FormData)
      if (typeof req.body.content === 'string') {
        try {
          const parsedContent = JSON.parse(req.body.content);
          updatedContent = { ...updatedContent, ...parsedContent };
        } catch (e) {
          console.error('Error parsing content JSON:', e);
        }
      } 
      // If content is sent as an object (from axios JSON)
      else if (req.body.content && typeof req.body.content === 'object') {
        updatedContent = { ...updatedContent, ...req.body.content };
      }
      // If the entire body is the content (direct send from frontend)
      else if (!req.body.content) {
        // Remove any multer-specific fields and merge the rest
        const { image, senderImage, ...contentData } = req.body;
        updatedContent = { ...updatedContent, ...contentData };
      }
    }

    // Handle individual form fields (for compatibility)
    const textFields = ['tagline', 'description', 'subHeading', 'mainText', 'bodyText', 'testimonialText', 'testimonialAuthor'];
    textFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updatedContent[field] = req.body[field];
      }
    });

    // Handle nested objects (like title, button)
    if (req.body.title && typeof req.body.title === 'object') {
      updatedContent.title = { ...updatedContent.title, ...req.body.title };
    }
    if (req.body.button && typeof req.body.button === 'object') {
      updatedContent.button = { ...updatedContent.button, ...req.body.button };
    }
    if (req.body.steps && Array.isArray(req.body.steps)) {
      updatedContent.steps = req.body.steps;
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        // Delete old image if exists
        if (updatedContent.imageUrl) {
          const oldImagePath = path.join(uploadsDir, path.basename(updatedContent.imageUrl));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updatedContent.imageUrl = `/uploads/${req.files.image[0].filename}`;
      }
      
      if (req.files.senderImage && req.files.senderImage[0]) {
        // Delete old sender image if exists
        if (updatedContent.senderImageUrl) {
          const oldSenderImagePath = path.join(uploadsDir, path.basename(updatedContent.senderImageUrl));
          if (fs.existsSync(oldSenderImagePath)) {
            fs.unlinkSync(oldSenderImagePath);
          }
        }
        updatedContent.senderImageUrl = `/uploads/${req.files.senderImage[0].filename}`;
      }
    }

    // Check content size
    const contentSize = JSON.stringify(updatedContent).length;
    if (contentSize > 5000000) { // 5MB limit for JSON content
      return res.status(413).json({ 
        message: 'Content is too large. Please use image URLs instead of base64 data.' 
      });
    }

    // Update or create the document
    const updated = await PageContent.findOneAndUpdate(
      { page, section },
      { 
        content: updatedContent, 
        updatedAt: new Date() 
      },
      { 
        new: true, 
        upsert: true // This will create the document if it doesn't exist
      }
    );

    // console.log('Updated content:', updated); // Debug log

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

    // Delete associated images if they exist
    if (deleted.content.imageUrl) {
      const imagePath = path.join(uploadsDir, path.basename(deleted.content.imageUrl));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    if (deleted.content.senderImageUrl) {
      const senderImagePath = path.join(uploadsDir, path.basename(deleted.content.senderImageUrl));
      if (fs.existsSync(senderImagePath)) {
        fs.unlinkSync(senderImagePath);
      }
    }

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