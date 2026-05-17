const express = require("express")
const { body, validationResult } = require("express-validator")
const QRCode = require("../models/QRCode")
const Restaurant = require("../models/Restaurant")
const { authenticateSubAdmin, verifyRestaurantAccess } = require("../middleware/auth")
const { generateQRID } = require("../utils/helpers")
const { generateMenuURL } = require("../utils/qrGenerator")
const { generateProfessionalQR } = require("../utils/awesomeQrGenerator")
const { createQrPdf } = require("../utils/qrPdf")
const { qrCodeValidation } = require("../utils/validation")

const router = express.Router()

// Get all QR codes for restaurant
router.get("/:resID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const { active = "" } = req.query

    const query = { resID }
    if (active !== "") query.isActive = active === "true"

    const qrCodes = await QRCode.find(query).sort({ createdAt: -1 })

    res.json({
      success: true,
      data: qrCodes,
      totalCodes: qrCodes.length,
    })
  } catch (error) {
    console.error("Get QR codes error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Download QR as PDF
router.get("/:resID/:qrID/pdf", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, qrID } = req.params

    // Load QR entry
    const qrCode = await QRCode.findOne({ qrID, resID })
    if (!qrCode) {
      return res.status(404).json({ success: false, message: "QR code not found" })
    }

    // Get restaurant for branding
    const restaurant = await Restaurant.findOne({ resID })
    const restaurantName = restaurant?.name || "Restaurant"

    // Ensure we have a branded PNG data URL using awesome-qr
    const menuURL = generateMenuURL(resID, qrID)
    const qrPngDataUrl = qrCode.qrCodeData || (await generateProfessionalQR(menuURL, restaurantName))

    const doc = createQrPdf({ restaurantName, qrPngDataUrl })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="qruzine-qr-${restaurantName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${qrID}.pdf"`
    )

    doc.pipe(res)
    doc.end()
  } catch (error) {
    console.error("QR PDF generation error:", error)
    res.status(500).json({ success: false, message: "Failed to generate QR PDF" })
  }
})

// Create new QR code
router.post("/:resID", authenticateSubAdmin, verifyRestaurantAccess, qrCodeValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { resID } = req.params
    const { type, description } = req.body

    // Get restaurant information for branding
    const restaurant = await Restaurant.findOne({ resID })
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    // Generate unique QR ID
    const qrID = generateQRID()

    // Generate menu URL
    const menuURL = generateMenuURL(resID, qrID)

    // Generate QR code image with restaurant branding (awesome-qr)
    const qrCodeImage = await generateProfessionalQR(menuURL, restaurant.name)

    // Create QR code record
    const qrCode = new QRCode({
      qrID,
      resID,
      type,
      description,
      qrCodeData: qrCodeImage,
    })

    await qrCode.save()

    res.status(201).json({
      success: true,
      message: "QR code created successfully",
      data: {
        qrID: qrCode.qrID,
        resID: qrCode.resID,
        type: qrCode.type,
        description: qrCode.description,
        menuURL,
        qrCodeImage: qrCode.qrCodeData,
        createdAt: qrCode.createdAt,
      },
    })
  } catch (error) {
    console.error("Create QR code error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update QR code
router.put("/:resID/:qrID", authenticateSubAdmin, verifyRestaurantAccess, qrCodeValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { resID, qrID } = req.params
    const { type, description } = req.body

    const qrCode = await QRCode.findOneAndUpdate(
      { qrID, resID },
      { type, description },
      { new: true, runValidators: true },
    )

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      })
    }

    res.json({
      success: true,
      message: "QR code updated successfully",
      data: qrCode,
    })
  } catch (error) {
    console.error("Update QR code error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Toggle QR code status
router.patch("/:resID/:qrID/toggle-status", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, qrID } = req.params

    const qrCode = await QRCode.findOne({ qrID, resID })

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      })
    }

    qrCode.isActive = !qrCode.isActive
    await qrCode.save()

    res.json({
      success: true,
      message: `QR code ${qrCode.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        qrID: qrCode.qrID,
        isActive: qrCode.isActive,
      },
    })
  } catch (error) {
    console.error("Toggle QR code status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete QR code
router.delete("/:resID/:qrID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, qrID } = req.params

    const qrCode = await QRCode.findOneAndDelete({ qrID, resID })

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      })
    }

    res.json({
      success: true,
      message: "QR code deleted successfully",
    })
  } catch (error) {
    console.error("Delete QR code error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get QR code details with statistics
router.get("/:resID/:qrID/details", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, qrID } = req.params

    const qrCode = await QRCode.findOne({ qrID, resID })

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      })
    }

    // Get order statistics for this QR code
    const Order = require("../models/Order")
    const totalOrders = await Order.countDocuments({ qrID, resID })
    const todayOrders = await Order.countDocuments({
      qrID,
      resID,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })

    const recentOrders = await Order.find({ qrID, resID })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderID customer.name totalAmount status createdAt")

    res.json({
      success: true,
      data: {
        ...qrCode.toObject(),
        menuURL: generateMenuURL(resID, qrID),
        statistics: {
          totalOrders,
          todayOrders,
          scanCount: qrCode.scanCount,
          lastScanned: qrCode.lastScanned,
        },
        recentOrders,
      },
    })
  } catch (error) {
    console.error("Get QR code details error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Regenerate QR code image
router.post("/:resID/:qrID/regenerate", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, qrID } = req.params

    const qrCode = await QRCode.findOne({ qrID, resID })

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      })
    }

    // Get restaurant information for branding
    const restaurant = await Restaurant.findOne({ resID })
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    // Generate new QR code image with restaurant branding (awesome-qr)
    const menuURL = generateMenuURL(resID, qrID)
    const qrCodeImage = await generateBrandedQRCode(menuURL, restaurant.name)

    qrCode.qrCodeData = qrCodeImage
    await qrCode.save()

    res.json({
      success: true,
      message: "QR code regenerated successfully",
      data: {
        qrID: qrCode.qrID,
        qrCodeImage: qrCode.qrCodeData,
        menuURL,
      },
    })
  } catch (error) {
    console.error("Regenerate QR code error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
