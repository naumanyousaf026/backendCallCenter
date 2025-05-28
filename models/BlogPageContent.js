const mongoose = require('mongoose');

const BlogPageContentSchema = new mongoose.Schema({
  section: { type: String, required: true },  // e.g., 'blogHead', 'blogList', 'featuredPosts', etc.
  content: mongoose.Schema.Types.Mixed        // component-specific data (object ya array)
});

module.exports = mongoose.model('BlogPageContent', BlogPageContentSchema);
