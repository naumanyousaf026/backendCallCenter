const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const aboutUsSchema = new mongoose.Schema({
  title: { type: String, required: true }, // AboutHead
  description: { type: String, required: true }, // AboutHead
  aboutTitle: { type: String, required: true }, // AboutSection
  aboutDescription: { type: String, required: true }, // AboutSection
  features: [featureSchema], // New field for features array
  image: { type: String }, // Optional image field
});

const AboutUs = mongoose.model('AboutUs', aboutUsSchema);

module.exports = AboutUs;
