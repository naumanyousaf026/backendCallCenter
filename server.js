const express = require("express");
const connectDB = require("./config/db");
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const path = require('path');

const contactFormRoutes = require("./routes/contactForm")
const blogRoutes = require("./routes/blog");
const adminRoutes = require("./routes/admin");
const PageContent = require("./routes/pageContent");
dotenv.config();
connectDB();

const cors = require("cors");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use CORS middleware
app.use(
  cors({
    origin:[ "http://localhost:3000", "http://localhost:5173"], // Frontend origin
    allowedHeaders: ["Authorization", "Content-Type"], // Allow Authorization header
  })
);
app.use(express.json());




app.use("/api/contact-form", contactFormRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/page-content",PageContent);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  

});