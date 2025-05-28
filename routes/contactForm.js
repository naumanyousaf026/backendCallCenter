const express = require("express");
const router = express.Router();
const ContactForm = require("../models/ContactForm");

// CREATE - Submit a new contact form
router.post("/", async (req, res) => {
  try {
    const newMessage = new ContactForm(req.body);
    await newMessage.save();
    res.status(201).json({ message: "Message sent successfully!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ - Get all messages
router.get("/", async (req, res) => {
  try {
    const messages = await ContactForm.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ - Get a specific message by ID
router.get("/:id", async (req, res) => {
  try {
    const message = await ContactForm.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE - Update a message by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedMessage = await ContactForm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedMessage) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Message updated", data: updatedMessage });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE - Delete a message by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedMessage = await ContactForm.findByIdAndDelete(req.params.id);
    if (!deletedMessage) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
