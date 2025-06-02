const express = require('express');
const router = express.Router();
const PageContent = require('../models/PageContent');
const verifyAdminToken = require('../middleware/adminAuthMiddleware'); // admin middleware

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
    res.status(500).json({ message: 'Error fetching page content', error: err });
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
    res.status(500).json({ message: 'Error fetching section', error: err });
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
    res.status(500).json({ message: 'Error creating section', error: err });
  }
});

// UPDATE section (Admin only)
router.put('/:page/:section', verifyAdminToken, async (req, res) => {
  try {
    const { page, section } = req.params;
    const { content } = req.body;

    const updated = await PageContent.findOneAndUpdate(
      { page, section },
      { content },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating section', error: err });
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
    res.status(500).json({ message: 'Error deleting section', error: err });
  }
});

module.exports = router;
