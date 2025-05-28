const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AboutUs = require("../models/AboutUs");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/aboutus/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ========== Helper Functions ========== //
const checkDBConnection = () => {
  const state = mongoose.connection.readyState;
  return state === 1;
};

const handleDBError = (res, operation, error) => {
  console.error(`${operation} - Database error:`, error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      details: error.message
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }

  return res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};

// ========== Multer Setup ========== //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// ========== Routes ========== //

// GET all
router.get('/', async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(500).json({
        message: 'Database not connected',
        connectionState: mongoose.connection.readyState
      });
    }

    const data = await AboutUs.find();
    res.json(data);
  } catch (error) {
    return handleDBError(res, 'GET /aboutus', error);
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(500).json({ message: 'Database not connected' });
    }

    const data = await AboutUs.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: 'AboutUs entry not found' });
    }

    res.json(data);
  } catch (error) {
    return handleDBError(res, 'GET /aboutus/:id', error);
  }
});



// POST route to save About Us data
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      aboutTitle,
      aboutDescription,
      features
    } = req.body;

    // Parse features JSON string
    let parsedFeatures;
    try {
      parsedFeatures = JSON.parse(features);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid features JSON format' });
    }

    const imagePath = req.file ? req.file.path : '';

    const aboutUs = new AboutUs({
      title,
      description,
      aboutTitle,
      aboutDescription,
      features: parsedFeatures,
      image: imagePath
    });

    await aboutUs.save();

    res.status(201).json({ message: 'About Us created successfully', aboutUs });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// PUT - Update by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(500).json({ message: 'Database not connected' });
    }

    const { title, description, aboutTitle, aboutDescription, features } = req.body;
    const image = req.file ? req.file.filename : null;

    const parsedFeatures = features ? JSON.parse(features) : [];

    const updateData = {
      title,
      description,
      aboutTitle,
      aboutDescription,
      features: parsedFeatures,
    };

    if (image) {
      updateData.image = image;
    }

    const updated = await AboutUs.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'AboutUs entry not found' });
    }

    res.json(updated);
  } catch (error) {
    return handleDBError(res, 'PUT /aboutus/:id', error);
  }
});

// DELETE by ID
router.delete('/:id', async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(500).json({ message: 'Database not connected' });
    }

    const deleted = await AboutUs.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'AboutUs entry not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    return handleDBError(res, 'DELETE /aboutus/:id', error);
  }
});

module.exports = router;
