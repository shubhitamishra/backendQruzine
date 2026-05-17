const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { body, validationResult } = require("express-validator")
const Restaurant = require("../models/Restaurant")
const { authenticateSuperAdmin, authenticateSubAdmin } = require("../middleware/auth")
const { comparePassword } = require("../utils/helpers")

const router = express.Router()

// Super Admin Login
router.post(
  "/superadmin/login",
  [
    body("adminId").notEmpty().withMessage("Admin ID is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { adminId, password } = req.body

    // Check super admin credentials
    if (adminId === process.env.SUPER_ADMIN_ID && password === process.env.SUPER_ADMIN_PASSWORD) {
      // Generate token for super admin
      const token = jwt.sign(
        {
          role: "superadmin",
          adminId: adminId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      )

      res.json({
        success: true,
        message: "Super admin login successful",
        token,
        user: {
          role: "superadmin",
          adminId: adminId,
        },
      })
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid super admin credentials",
      })
    }
  },
)

// Sub Admin (Restaurant) Login
router.post(
  "/subadmin/login",
  [
    body("adminId").notEmpty().withMessage("Admin ID is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { adminId, password } = req.body

      // Find restaurant by admin ID
      const restaurant = await Restaurant.findOne({
        "credentials.adminId": adminId,
        isActive: true,
      })

      if (!restaurant) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, restaurant.credentials.password)

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          role: "subadmin",
          resID: restaurant.resID,
          adminId: restaurant.credentials.adminId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      )

      res.json({
        success: true,
        message: "Restaurant admin login successful",
        token,
        user: {
          role: "subadmin",
          resID: restaurant.resID,
          adminId: restaurant.credentials.adminId,
          restaurantName: restaurant.name,
          businessType: restaurant.businessType,
        },
      })
    } catch (error) {
      console.error("Sub admin login error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  },
)

// Verify Token
router.get("/verify", authenticateSubAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    user: {
      role: req.user.role,
      resID: req.user.resID,
      adminId: req.user.adminId,
      restaurantName: req.user.restaurant.name,
      businessType: req.user.restaurant.businessType,
    },
  })
})

// Change Sub Admin Password
router.put(
  "/subadmin/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  authenticateSubAdmin,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { currentPassword, newPassword } = req.body
      const { resID } = req.user

      const restaurant = await Restaurant.findOne({ resID })

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, restaurant.credentials.password)

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10)
      const hashedNewPassword = await bcrypt.hash(newPassword, salt)

      // Update password
      restaurant.credentials.password = hashedNewPassword
      await restaurant.save()

      res.json({
        success: true,
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  },
)

// Get Current User Profile
router.get("/profile", authenticateSubAdmin, (req, res) => {
  const restaurant = req.user.restaurant

  res.json({
    success: true,
    data: {
      resID: restaurant.resID,
      name: restaurant.name,
      location: restaurant.location,
      businessType: restaurant.businessType,
      gstNumber: restaurant.gstNumber,
      contactInfo: restaurant.contactInfo,
      adminId: restaurant.credentials.adminId,
      createdAt: restaurant.createdAt,
    },
  })
})

// Update Restaurant Profile
router.put(
  "/profile",
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("location").optional().trim().notEmpty().withMessage("Location cannot be empty"),
    body("businessType").optional().isIn(["Restaurant", "Hotel", "Other"]).withMessage("Invalid business type"),
    body("gstNumber").optional().trim(),
    body("contactInfo.phone").optional().trim(),
    body("contactInfo.email").optional().isEmail().withMessage("Invalid email format"),
    body("contactInfo.website").optional().trim(),
  ],
  authenticateSubAdmin,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { resID } = req.user
      const updateData = req.body

      const restaurant = await Restaurant.findOneAndUpdate({ resID }, updateData, {
        new: true,
        runValidators: true,
      })

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          resID: restaurant.resID,
          name: restaurant.name,
          location: restaurant.location,
          businessType: restaurant.businessType,
          gstNumber: restaurant.gstNumber,
          contactInfo: restaurant.contactInfo,
        },
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  },
)

// Logout (client-side token removal, but we can log it)
router.post("/logout", (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  res.json({
    success: true,
    message: "Logged out successfully",
  })
})

module.exports = router
