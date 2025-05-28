const mongoose = require("mongoose");

const clientStatSchema = new mongoose.Schema({
  value: { type: String, required: true },       // e.g., "98%" or "5,000"
  description: { type: String, required: true }, // e.g., "Satisfied Clients"
  bgColor: { type: String, default: "#000000" }, // Optional: customize card color
  textColor: { type: String, default: "#FFFFFF" } // Optional: customize text color
});

const ClientStat = mongoose.model("ClientStat", clientStatSchema);
module.exports = ClientStat;
