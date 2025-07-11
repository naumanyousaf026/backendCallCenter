const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const verifyAdminToken = require('../middleware/adminAuthMiddleware');
const router = express.Router();

// Ensure upload directory exists
const blogImagesDir = path.join(__dirname, "../blogImages");
if (!fs.existsSync(blogImagesDir)) {
  fs.mkdirSync(blogImagesDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, blogImagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'blog-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Slug generator
async function generateSlugs() {
  try {
    const blogs = await Blog.find({ $or: [{ slug: { $exists: false } }, { slug: "" }] });
    for (const blog of blogs) {
      const slug = slugify(blog.title, { lower: true, strict: true });
      const existingBlog = await Blog.findOne({ slug });

      blog.slug = existingBlog && existingBlog._id.toString() !== blog._id.toString()
        ? `${slug}-${Date.now().toString().slice(-4)}`
        : slug;

      await blog.save();
    }
  } catch (error) {
    console.error('Error generating slugs:', error);
  }
}

// Public: Get published blogs
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;
    const query = { status: "published" };
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-content');

    const count = await Blog.countDocuments(query);
    res.status(200).json({
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalBlogs: count,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs", details: err.message });
  }
});

// Admin: Get all blogs
router.get("/admin/all", verifyAdminToken, async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all blogs", details: err.message });
  }
});

// Public: Get single published blog by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ error: "Blog not found or not published" });
    }
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog", details: err.message });
  }
});

// Admin: Create blog
router.post("/", verifyAdminToken, upload.single("featuredImage"), async (req, res) => {
  try {
    const { title, duration, category, content, tags, status = 'draft', author = 'Admin' } = req.body;
    const slug = slugify(title, { lower: true, strict: true });

    const newBlog = new Blog({ title, slug, duration, category, content, status, author });

    if (req.file) {
      newBlog.featuredImage = `/blogImages/${req.file.filename}`;
      newBlog.image = `/blogImages/${req.file.filename}`;
    }

    if (tags) {
      newBlog.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (err) {
    res.status(500).json({ error: "Failed to save blog", details: err.message });
  }
});

// Admin: Update blog
router.patch('/:id', verifyAdminToken, upload.single('featuredImage'), async (req, res) => {
  try {
    const blogData = {
      title: req.body.title,
      duration: req.body.duration,
      category: req.body.category,
      content: req.body.content,
      status: req.body.status,
      author: req.body.author,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    };

    if (req.body.title) {
      blogData.slug = slugify(req.body.title, { lower: true, strict: true });
    }

    if (req.file) {
      const oldBlog = await Blog.findById(req.params.id);
      if (oldBlog && oldBlog.image && oldBlog.image !== blogData.image) {
        const oldImagePath = path.join(__dirname, '..', oldBlog.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      blogData.image = `/blogImages/${req.file.filename}`;
      blogData.featuredImage = `/blogImages/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blogData, { new: true });
    if (!updatedBlog) return res.status(404).json({ message: 'Blog not found' });
    res.json(updatedBlog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Delete blog
router.delete("/:id", verifyAdminToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    if (blog.featuredImage) {
      const imagePath = path.join(__dirname, '..', blog.featuredImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blog", details: err.message });
  }
});

// Public: Get blog by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: "published" });
    if (!blog) return res.status(404).json({ error: "Blog not found or not published" });
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog", details: err.message });
  }
});

// Public: Get all categories
router.get("/categories/all", async (req, res) => {
  try {
    const categories = await Blog.distinct("category");
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories", details: err.message });
  }
});

// Public: Get all tags
router.get("/tags/all", async (req, res) => {
  try {
    const tags = await Blog.distinct("tags");
    res.status(200).json(tags);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tags", details: err.message });
  }
});

// Admin: Generate slugs
router.post("/admin/generate-slugs", verifyAdminToken, async (req, res) => {
  try {
    await generateSlugs();
    res.status(200).json({ message: "Slugs generated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate slugs", details: err.message });
  }
});

module.exports = router;
