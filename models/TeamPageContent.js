const mongoose = require("mongoose");

// Define the team member schema
const teamMemberSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String, // Will be a combination of first and last name
  role: String,
  description: String,
  email: String,
  image: String, // Image for the team member
});

// Define the section schema for the page content
const sectionSchema = new mongoose.Schema({
  section: { type: String, required: true, unique: true },
  content: mongoose.Schema.Types.Mixed, // Can hold any type of content (like team member list, banner image, etc.)
});

// Export the TeamPageContent model
module.exports = mongoose.model("TeamPageContent", sectionSchema);
