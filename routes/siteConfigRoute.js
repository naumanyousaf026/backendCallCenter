const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const SiteConfig = require("../models/SiteConfig");
const verifyAdminToken = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// ✅ Define the uploads directory path
const uploadsDir = path.join(__dirname, "..", "uploads", "logo");


// ✅ Ensure the directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ===== Multer Setup with size limits ===== //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET route
router.get("/", async (req, res) => {
  try {
    const config = await SiteConfig.findOne().sort({ createdAt: -1 });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch site config." });
  }
});

// POST or UPDATE
router.post("/", verifyAdminToken, upload.single("logo"), async (req, res) => {
  try {
    const { brandName } = req.body;
    const logoPath = req.file ? `/uploads/logo/${req.file.filename}` : null;

    let config = await SiteConfig.findOne();

    if (config) {
      if (logoPath && config.logo && fs.existsSync(`.${config.logo}`)) {
        fs.unlinkSync(`.${config.logo}`);
      }

      config.brandName = brandName || config.brandName;
      if (logoPath) config.logo = logoPath;

      await config.save();
    } else {
      config = new SiteConfig({
        brandName,
        logo: logoPath || "",
      });
      await config.save();
    }

    res.json({ message: "Site config updated successfully", config });
  } catch (error) {
    console.error("Update failed", error);
    res.status(500).json({ error: "Failed to update site config." });
  }
});

module.exports = router;
