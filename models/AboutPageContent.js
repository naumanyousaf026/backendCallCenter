const mongoose = require('mongoose');

const aboutPageContentSchema = new mongoose.Schema({
  section: { type: String, required: true, unique: true }, // e.g., 'AboutHead', 'Clients'
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // Flexible content structure
});

module.exports = mongoose.model('AboutPageContent', aboutPageContentSchema);
