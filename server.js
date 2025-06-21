const express = require("express");
const connectDB = require("./config/db");
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const path = require('path');

const contactFormRoutes = require("./routes/contactForm")
const blogRoutes = require("./routes/blog");
const blogPageRoutes = require("./routes/blogPageContent");
const adminRoutes = require("./routes/admin");
const PageContent = require("./routes/pageContent");
const teamRoutes = require("./routes/team");
const SiteConfigRoutes = require("./routes/siteConfigRoute"); 
dotenv.config();
connectDB();

const cors = require("cors");
const app = express();

// ===== INCREASED BODY PARSER LIMITS ===== //
app.use(bodyParser.json({ 
  limit: '50mb',           // JSON payload limit
  parameterLimit: 50000    // URL parameters limit
}));
app.use(bodyParser.urlencoded({ 
  limit: '50mb',           // URL encoded payload limit
  extended: true,
  parameterLimit: 50000
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/blogImages', express.static(path.join(__dirname, 'blogImages')));
app.use("/TeamImages", express.static(path.join(__dirname, "TeamImages")));
// Use CORS middleware
app.use(
  cors({
    origin:[ "http://localhost:3000", "http://localhost:5173"], // Frontend origin
    allowedHeaders: ["Authorization", "Content-Type"], // Allow Authorization header
  })
);

// ===== ALSO INCREASE EXPRESS JSON LIMIT ===== //
app.use(express.json({ 
  limit: '50mb',           // Express JSON limit
  parameterLimit: 50000
}));
app.use(express.urlencoded({ 
  limit: '50mb',           // Express URL encoded limit
  extended: true,
  parameterLimit: 50000
}));

app.use("/api/contact-form", contactFormRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/blog-page", blogPageRoutes);
app.use("/api/page-content",PageContent);
app.use("/api/site-config", SiteConfigRoutes);
app.use("/api/team", teamRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});