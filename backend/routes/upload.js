const express = require("express")
const { uploadSingle, deleteImage, extractPublicId } = require("../utils/cloudinary")
const { authenticateSubAdmin, verifyRestaurantAccess } = require("../middleware/auth")

const router = express.Router()

// Upload single image
router.post("/image/:resID", authenticateSubAdmin, verifyRestaurantAccess, (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err)
      return res.status(400).json({
        success: false,
        message: err.message || "Error uploading image",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      })
    }

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    })
  })
})

// Delete image
router.delete("/image/:resID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      })
    }

    const publicId = extractPublicId(imageUrl)
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Invalid image URL",
      })
    }

    const result = await deleteImage(publicId)
    
    if (result.result === "ok") {
      res.json({
        success: true,
        message: "Image deleted successfully",
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete image",
      })
    }
  } catch (error) {
    console.error("Delete image error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
