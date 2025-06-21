const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const verifyAdminToken = require("../middleware/adminAuthMiddleware");

const { sendOTPViaEmail } = require("../utils/otpService");
require("dotenv").config();

const router = express.Router();
let otpStore = {};

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}

// Register Route
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (email !== "naumanyousaf026@gmail.com") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = new Admin({ name, email, password: hashedPassword });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login Route - FIXED: Added role to JWT payload
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (email !== "naumanyousaf026@gmail.com") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // FIXED: Include role in JWT payload
    const token = jwt.sign(
      { id: admin._id, role: "admin" }, 
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Increased to 24h for better UX
    );

    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset Password Route
router.post("/resetpassword", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email and new password are required" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Send OTP Route
router.post("/sendotp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const otp = generateOTP();
    otpStore[email] = otp;

    await sendOTPViaEmail(email, otp);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Resend OTP Route
router.post("/resendotp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const otp = generateOTP();
    otpStore[email] = otp;

    await sendOTPViaEmail(email, otp);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Verify OTP Route
router.post("/verifyotp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const storedOtp = otpStore[email];

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP has expired or not sent" });
    }

    if (parseInt(otp, 10) !== storedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    delete otpStore[email];
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ADDED: Logout Route (optional - for server-side token invalidation)
router.post("/logout", async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just send a success response
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Change Password (only accessible to logged-in admin)
router.post("/changepassword", verifyAdminToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const admin = req.admin; // set by middleware

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Old and new passwords are required" });
  }

  try {
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Admin Profile (only accessible to logged-in admin)
router.put("/updateprofile", verifyAdminToken, async (req, res) => {
  const { name, phone, image } = req.body;
  const admin = req.admin; // from middleware

  try {
    // Only update if values are provided
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (image) admin.image = image;

    await admin.save();

    res.status(200).json({
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        image: admin.image,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Get Logged-in Admin Info
router.get("/me", verifyAdminToken, async (req, res) => {
  try {
    const admin = req.admin; // set by middleware
    res.status(200).json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      image: admin.image,
    });
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;