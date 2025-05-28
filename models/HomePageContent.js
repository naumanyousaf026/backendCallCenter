// models/HomePageContent.js
const mongoose = require('mongoose');

const HomePageContentSchema = new mongoose.Schema({
  section: { type: String, required: true }, // e.g., 'heroSection', 'partnerLogos', 'about', 'work', 'features', 'voxenPro'
  content: mongoose.Schema.Types.Mixed,      // Can hold object, array, string, etc.
});

module.exports = mongoose.model('HomePageContent', HomePageContentSchema);
