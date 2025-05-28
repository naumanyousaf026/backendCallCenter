const mongoose = require("mongoose");

const contactInfoSchema = new mongoose.Schema({
  location: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model("ContactInfo", contactInfoSchema);
