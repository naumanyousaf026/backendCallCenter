const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String,
  role: String,
  description: String,
  email: String,
  image: String,
});

const teamContentSchema = new mongoose.Schema({
  bannerImage: { type: String, required: true },   // 1. Banner image filename/path
  bannerTitle: { type: String, required: true },   // 2. Banner main title
  bannerSubtitle: { type: String, required: true }, // 3. Banner subtitle

  sectionSmallHeading: { type: String, required: true }, // 4. "Our team" small heading
  sectionMainHeading: { type: String, required: true },  // 5a. "The people behind every great conversation"
  sectionParagraph1: { type: String, required: true },   // 5b. Paragraph 1
  sectionParagraph2: { type: String, required: true },   // 5c. Paragraph 2

  members: [teamMemberSchema], // Team members array
});

const TeamContent = mongoose.model("TeamContent", teamContentSchema);
module.exports = TeamContent;
