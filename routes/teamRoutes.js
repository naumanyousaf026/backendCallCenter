const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const TeamContent = require("../models/Team");

// Serve static images
router.use("/images", express.static(path.join(__dirname, "../TeamImages")));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./TeamImages";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/**
 * CREATE - POST Team Content
 */
router.post(
  "/",
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "memberImages" },
  ]),
  async (req, res) => {
    try {
      const files = req.files || {};
      const bannerImageFile = files.bannerImage?.[0];

      if (!bannerImageFile) {
        return res.status(400).json({ error: "Banner image is required." });
      }

      const {
        bannerTitle,
        bannerSubtitle,
        sectionSmallHeading,
        sectionMainHeading,
        sectionParagraph1,
        sectionParagraph2,
        members,
      } = req.body;

      let parsedMembers = [];
      try {
        parsedMembers = JSON.parse(members);
      } catch (err) {
        return res.status(400).json({ error: "Members must be a valid JSON array." });
      }

      const memberImages = files.memberImages || [];

      if (parsedMembers.length !== memberImages.length) {
        return res.status(400).json({ error: "Mismatch between members and images." });
      }

      const fullMembers = parsedMembers.map((m, idx) => ({
        ...m,
        name: `${m.firstName} ${m.lastName}`,
        image: memberImages[idx] ? memberImages[idx].filename : null,
      }));

      const teamContent = new TeamContent({
        bannerImage: bannerImageFile.filename,
        bannerTitle,
        bannerSubtitle,
        sectionSmallHeading,
        sectionMainHeading,
        sectionParagraph1,
        sectionParagraph2,
        members: fullMembers,
      });

      const saved = await teamContent.save();
      res.status(201).json(saved);
    } catch (err) {
      console.error("Error in POST /team:", err);
      res.status(500).json({ error: "Failed to create team content" });
    }
  }
);

/**
 * READ - GET Team Content
 */
router.get("/", async (req, res) => {
  try {
    const content = await TeamContent.findOne();

    if (!content) return res.status(404).json({ error: "No team content found" });

    const baseUrl = `${req.protocol}://${req.get("host")}/team/images/`;

    const formatted = {
      ...content.toObject(),
      bannerImage: content.bannerImage ? baseUrl + content.bannerImage : null,
      members: content.members.map((m) => ({
        ...m,
        image: m.image ? baseUrl + m.image : null,
      })),
    };

    res.json(formatted);
  } catch (err) {
    console.error("Error in GET /team:", err);
    res.status(500).json({ error: "Failed to fetch team content" });
  }
});

/**
 * UPDATE - PUT Team Content by ID
 */
router.put(
  "/:id",
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "memberImages" },
  ]),
  async (req, res) => {
    try {
      const content = await TeamContent.findById(req.params.id);
      if (!content) return res.status(404).json({ error: "Content not found" });

      const files = req.files || {};
      const newBanner = files.bannerImage?.[0];
      const memberImages = files.memberImages || [];

      if (newBanner && content.bannerImage) {
        fs.unlinkSync(path.join("TeamImages", content.bannerImage));
      }

      const {
        bannerTitle,
        bannerSubtitle,
        sectionSmallHeading,
        sectionMainHeading,
        sectionParagraph1,
        sectionParagraph2,
        members,
      } = req.body;

      let parsedMembers = [];
      try {
        parsedMembers = JSON.parse(members);
      } catch (err) {
        return res.status(400).json({ error: "Invalid members format." });
      }

      const fullMembers = parsedMembers.map((m, idx) => ({
        ...m,
        name: `${m.firstName} ${m.lastName}`,
        image: memberImages[idx]
          ? memberImages[idx].filename
          : content.members[idx]?.image || null,
      }));

      // Update fields
      content.bannerImage = newBanner ? newBanner.filename : content.bannerImage;
      content.bannerTitle = bannerTitle;
      content.bannerSubtitle = bannerSubtitle;
      content.sectionSmallHeading = sectionSmallHeading;
      content.sectionMainHeading = sectionMainHeading;
      content.sectionParagraph1 = sectionParagraph1;
      content.sectionParagraph2 = sectionParagraph2;
      content.members = fullMembers;

      const updated = await content.save();
      res.json(updated);
    } catch (err) {
      console.error("Error in PUT /team:", err);
      res.status(500).json({ error: "Failed to update content" });
    }
  }
);

/**
 * DELETE - DELETE Team Content by ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const content = await TeamContent.findById(req.params.id);
    if (!content) return res.status(404).json({ error: "Content not found" });

    if (content.bannerImage) {
      fs.unlinkSync(path.join("TeamImages", content.bannerImage));
    }

    content.members.forEach((member) => {
      if (member.image) {
        fs.unlinkSync(path.join("TeamImages", member.image));
      }
    });

    await content.deleteOne();
    res.json({ message: "Team content deleted successfully" });
  } catch (err) {
    console.error("Error in DELETE /team:", err);
    res.status(500).json({ error: "Failed to delete content" });
  }
});

module.exports = router;
