const mongoose = require("mongoose");

const siteConfigSchema = new mongoose.Schema({
  logo: {
    type: String,
    required: true,
  },
  brandName: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("SiteConfig", siteConfigSchema);
