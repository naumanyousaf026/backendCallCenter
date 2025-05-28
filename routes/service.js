// routes/service.js
const express = require("express");
const multer = require("multer");
const Service = require("../models/Service");
const path = require("path");

const router = express.Router();

// Configure multer for file uploads to the ServiceImage folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../ServiceImage")); // Ensure the full path is used
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// GET all services
router.get("/", async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a single service by ID
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new service with image upload
router.post("/", upload.single("image"), async (req, res) => {
  const service = new Service({
    image: req.file ? req.file.filename : null,
    name: req.body.name,
    description: req.body.description,
  });

  try {
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a service by ID
router.put("/:id", upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    image: req.file ? req.file.path : null, // Handle image upload on update
  };

  try {
    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a service by ID
router.delete("/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
