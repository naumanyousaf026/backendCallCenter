const express = require('express');
const router = express.Router();
const FaqSection = require('../models/FaqSection');

// GET: Get the FAQ section
router.get('/', async (req, res) => {
  try {
    const section = await FaqSection.findOne();
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Create a new FAQ section
router.post('/', async (req, res) => {
  try {
    const newSection = new FaqSection(req.body);
    await newSection.save();
    res.status(201).json(newSection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Update the section
router.put('/:id', async (req, res) => {
  try {
    const updated = await FaqSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE: Delete a specific FAQ from section
router.delete('/:sectionId/faqs/:faqId', async (req, res) => {
  try {
    const section = await FaqSection.findById(req.params.sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    section.faqs.id(req.params.faqId).remove();
    await section.save();
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Add new FAQ
router.patch('/:id/faqs', async (req, res) => {
  try {
    const section = await FaqSection.findById(req.params.id);
    section.faqs.push(req.body);
    await section.save();
    res.json(section);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
