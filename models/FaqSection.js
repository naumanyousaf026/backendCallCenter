// models/faqSection.js
const mongoose = require('mongoose');

const faqSectionSchema = new mongoose.Schema({
  subtitle: String, // "faq"
  heading: String,  // "Frequently Asked Questions"
  description: String, // paragraph text
  faqs: [
    {
      question: String,
      answer: String
    }
  ]
});

module.exports = mongoose.model('FaqSection', faqSectionSchema);
