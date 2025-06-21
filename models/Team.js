const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true },
  name: { type: String }, // This will be automatically generated
  role: { type: String, required: true },
  Phone: { type: String ,unique: true }, // Unique phone number for each team member
  joinDate: { type: Date, default: Date.now }, // Automatically set to current date
  description: { type: String },
  image: { type: String }, // Optional field for the team member's image
  email: { type: String, required: true, unique: true }, // New field for team member's email
});

// Pre-save middleware to combine firstName and lastName into name
teamSchema.pre("save", function (next) {
  this.name = `${this.firstName} ${this.lastName}`;
  next();
});

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
