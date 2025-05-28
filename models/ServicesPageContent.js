// models/ServicesPageContent.js
const mongoose = require('mongoose');

const ServicesPageContentSchema = new mongoose.Schema({
  section: { type: String, required: true }, // e.g., 'servicesHead', 'inbound', 'accordion', 'customerSupport'
  content: mongoose.Schema.Types.Mixed,      // dynamic content (object or array)
});

module.exports = mongoose.model('ServicesPageContent', ServicesPageContentSchema);
