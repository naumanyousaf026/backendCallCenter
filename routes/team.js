const express = require("express");
const multer = require("multer");
const router = express.Router();
const Team = require("../models/Team");
const path = require("path");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./TeamImages"); // Folder path for saving images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Store with unique filename
  },
});

const upload = multer({ storage: storage });

// CREATE a new team member with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Create new team member, automatically setting the name as firstName + lastName
    const newTeamMember = new Team({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      role: req.body.role,
      Phone: req.body.Phone, // Optional phone field
      joinDate: req.body.joinDate ? new Date(req.body.joinDate) : Date.now(), // Use provided date or current date
      description: req.body.description,
      email: req.body.email, // Capture email from request body
      image: req.file ? req.file.filename : undefined, // Save just the filename
    });

    const savedTeamMember = await newTeamMember.save();
    res.status(201).json(savedTeamMember);
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(400).json({ error: "Failed to create team member" });
  }
});

// READ all team members
router.get("/", async (req, res) => {
  try {
    const team = await Team.find();
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// READ a single team member by ID
router.get("/:id", async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    if (!teamMember)
      return res.status(404).json({ error: "Team member not found" });
    res.json(teamMember);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch team member" });
  }
});

// UPDATE a team member by ID with image upload
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    // Prepare updated data, keeping firstName and lastName separate
    const updatedData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      role: req.body.role,
      Phone: req.body.Phone, // Optional phone field
      joinDate: req.body.joinDate ? new Date(req.body.joinDate) : Date.now(), // Use provided date or current date
      description: req.body.description,
      email: req.body.email, // Capture email from request body
    };

    // If there's a new image, update the image filename only (without path)
    if (req.file) {
      updatedData.image = req.file.filename;
    }

    const updatedTeamMember = await Team.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedTeamMember)
      return res.status(404).json({ error: "Team member not found" });

    res.json(updatedTeamMember);
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(400).json({ error: "Failed to update team member" });
  }
});

// DELETE a team member by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedTeamMember = await Team.findByIdAndDelete(req.params.id);
    if (!deletedTeamMember)
      return res.status(404).json({ error: "Team member not found" });
    res.json({ message: "Team member deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete team member" });
  }
});

module.exports = router;