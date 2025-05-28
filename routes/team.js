const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const TeamPageContent = require("../models/TeamPageContent");

// Serve static images
router.use("/images", express.static(path.join(__dirname, "../TeamImages")));

// Multer setup for image uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./TeamImages";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// **GET** all team page sections
router.get("/", async (req, res) => {
  try {
    const data = await TeamPageContent.find({});
    const result = {};
    data.forEach((item) => {
      result[item.section] = item.content;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch team page data" });
  }
});

// **POST** create a new section
router.post("/", upload.any(), async (req, res) => {
  try {
    let content = req.body;

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname === "bannerImage") {
          content.bannerImage = file.filename;
        } else if (file.fieldname.startsWith("memberImage-")) {
          const index = file.fieldname.split("-")[1];
          if (!content.members) return;
          let members = Array.isArray(content.members)
            ? content.members
            : JSON.parse(content.members);  // Check if content.members is a stringified array
          members[index].image = file.filename;
          content.members = members;  // Update members array with image filename
        }
      });
    }

    // Ensure member names are updated with first and last names combined
    if (content.members) {
      content.members = content.members.map((m) => ({
        ...m,
        name: `${m.firstName} ${m.lastName}`,
      }));
    }

    // Create a new section in the database
    const newSection = new TeamPageContent({
      section: req.body.section,
      content,
    });

    await newSection.save();
    res.status(201).json(newSection);
  } catch (err) {
    console.error("POST /team error:", err);
    res.status(500).json({ error: "Failed to create team page section" });
  }
});

// **PUT** or **CREATE** a section (update or create)
router.put("/:section", upload.any(), async (req, res) => {
  try {
    const { section } = req.params;
    let content = req.body;

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname === "bannerImage") {
          content.bannerImage = file.filename;
        } else if (file.fieldname.startsWith("memberImage-")) {
          const index = file.fieldname.split("-")[1];
          if (!content.members) return;
          const members = JSON.parse(content.members);
          members[index].image = file.filename;
          content.members = members;
        }
      });
    }

    // Format members array with name as a combination of first and last names
    if (content.members) {
      content.members = JSON.parse(content.members).map((m) => ({
        ...m,
        name: `${m.firstName} ${m.lastName}`,
      }));
    }

    // Find or create the section in the database
    const updated = await TeamPageContent.findOneAndUpdate(
      { section },
      { content },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("PUT /team/:section error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// **DELETE** a section
router.delete("/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const content = await TeamPageContent.findOne({ section });
    if (!content) return res.status(404).json({ error: "Section not found" });

    // Delete associated images from disk
    const { bannerImage, members } = content.content;
    if (bannerImage) fs.unlinkSync(path.join("TeamImages", bannerImage));
    if (Array.isArray(members)) {
      members.forEach((m) => {
        if (m.image) fs.unlinkSync(path.join("TeamImages", m.image));
      });
    }

    // Delete the section from the database
    await TeamPageContent.deleteOne({ section });
    res.json({ message: "Section deleted successfully" });
  } catch (err) {
    console.error("DELETE /team/:section error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
