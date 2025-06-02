// models/PageContent.js
const mongoose = require('mongoose');

const PageContentSchema = new mongoose.Schema({
  page: { type: String, required: true },     // e.g., 'home', 'about', 'services', 'contact'
  section: { type: String, required: true },  // e.g., 'heroSection', 'aboutHead', etc.
  content: mongoose.Schema.Types.Mixed        // Can be object, array, string, etc.
}, {
  timestamps: true
});

PageContentSchema.index({ page: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('PageContent', PageContentSchema);
