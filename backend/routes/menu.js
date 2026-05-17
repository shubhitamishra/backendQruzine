const express = require("express")
const { body, validationResult } = require("express-validator")
const MenuItem = require("../models/Menu")
const Category = require("../models/Category")
const QRCode = require("../models/QRCode")
const Restaurant = require("../models/Restaurant")
const { authenticateSubAdmin, verifyRestaurantAccess } = require("../middleware/auth")
const { generateMenuID } = require("../utils/helpers")
const { menuItemValidation } = require("../utils/validation")
const { deleteImage, extractPublicId } = require("../utils/cloudinary")

const router = express.Router()

// =========================
// SUBADMIN ROUTES (must be first)
// =========================

// Get menu items for restaurant admin (with filters)
router.get("/subadmin/:resID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const { category = "", search = "", available = "" } = req.query

    // Build query
    const query = { resID }
    if (category) query.category = category
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    }
    if (available !== "") query.isAvailable = available === "true"

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 })
    const categories = await MenuItem.distinct("category", { resID })

    res.json({
      success: true,
      data: {
        items: menuItems,
        categories,
        totalItems: menuItems.length,
      },
    })
  } catch (error) {
    console.error("Get menu items error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Add new menu item
router.post("/subadmin/:resID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const menuData = req.body

    // Validate required fields
    if (!menuData.name || !menuData.category) {
      return res.status(400).json({
        success: false,
        message: "Name and category are required",
      })
    }

    // Validate variants if provided
    if (menuData.variants && menuData.variants.length > 0) {
      for (const variant of menuData.variants) {
        if (!variant.name || variant.price === undefined || variant.price < 0) {
          return res.status(400).json({
            success: false,
            message: "Each variant must have a name and valid price",
          })
        }
      }
    } else if (!menuData.basePrice || menuData.basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Base price is required when no variants are provided",
      })
    }

    // Check if category exists
    const categoryExists = await Category.findOne({ resID, name: menuData.category })
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Category does not exist. Please create the category first.",
      })
    }

    const menuItem = new MenuItem({
      menuID: generateMenuID(),
      resID,
      categoryID: categoryExists.categoryID,
      ...menuData,
    })

    await menuItem.save()

    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: menuItem,
    })
  } catch (error) {
    console.error("Add menu item error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Update menu item
router.put("/subadmin/:resID/:menuID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, menuID } = req.params
    const updateData = req.body
    delete updateData.menuID
    delete updateData.resID

    // Validate required fields
    if (!updateData.name || !updateData.category) {
      return res.status(400).json({
        success: false,
        message: "Name and category are required",
      })
    }

    // Validate variants if provided
    if (updateData.variants && updateData.variants.length > 0) {
      for (const variant of updateData.variants) {
        if (!variant.name || variant.price === undefined || variant.price < 0) {
          return res.status(400).json({
            success: false,
            message: "Each variant must have a name and valid price",
          })
        }
      }
    } else if (!updateData.basePrice || updateData.basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Base price is required when no variants are provided",
      })
    }

    // Check if category exists
    const categoryExists = await Category.findOne({ resID, name: updateData.category })
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Category does not exist. Please create the category first.",
      })
    }

    // Get existing item to handle image deletion if needed
    const existingItem = await MenuItem.findOne({ menuID, resID })
    if (!existingItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" })
    }

    // If image is being changed, delete old image from Cloudinary
    if (existingItem.image && updateData.image && existingItem.image !== updateData.image) {
      try {
        const publicId = extractPublicId(existingItem.image)
        if (publicId) {
          await deleteImage(publicId)
        }
      } catch (error) {
        console.error("Error deleting old image:", error)
        // Continue with update even if image deletion fails
      }
    }

    updateData.categoryID = categoryExists.categoryID

    const menuItem = await MenuItem.findOneAndUpdate(
      { menuID, resID },
      updateData,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: "Menu item updated successfully",
      data: menuItem,
    })
  } catch (error) {
    console.error("Update menu item error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Toggle menu item availability
router.patch(
  "/subadmin/:resID/:menuID/toggle-availability",
  authenticateSubAdmin,
  verifyRestaurantAccess,
  async (req, res) => {
    try {
      const { resID, menuID } = req.params
      const menuItem = await MenuItem.findOne({ menuID, resID })

      if (!menuItem) {
        return res.status(404).json({ success: false, message: "Menu item not found" })
      }

      menuItem.isAvailable = !menuItem.isAvailable
      await menuItem.save()

      res.json({
        success: true,
        message: `Menu item ${menuItem.isAvailable ? "enabled" : "disabled"} successfully`,
        data: { menuID: menuItem.menuID, isAvailable: menuItem.isAvailable },
      })
    } catch (error) {
      console.error("Toggle menu item availability error:", error)
      res.status(500).json({ success: false, message: "Internal server error" })
    }
  }
)

// Delete menu item
router.delete("/subadmin/:resID/:menuID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, menuID } = req.params
    const menuItem = await MenuItem.findOneAndDelete({ menuID, resID })

    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" })
    }

    res.json({ success: true, message: "Menu item deleted successfully" })
  } catch (error) {
    console.error("Delete menu item error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Get menu categories
router.get("/subadmin/:resID/categories", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params

    const categories = await MenuItem.aggregate([
      { $match: { resID } },
      {
        $group: {
          _id: "$category",
          itemCount: { $sum: 1 },
          availableCount: { $sum: { $cond: ["$isAvailable", 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ])

    res.json({
      success: true,
      data: categories.map((cat) => ({
        name: cat._id,
        itemCount: cat.itemCount,
        availableCount: cat.availableCount,
      })),
    })
  } catch (error) {
    console.error("Get menu categories error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// =========================
// PUBLIC ROUTE (must be last!)
// =========================
router.get("/:resID/:qrID", async (req, res) => {
  try {
    const { resID, qrID } = req.params

    const restaurant = await Restaurant.findOne({ resID, isActive: true })
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found or inactive" })
    }

    const qrCode = await QRCode.findOne({ qrID, resID, isActive: true })
    if (!qrCode) {
      return res.status(404).json({ success: false, message: "QR code not found or inactive" })
    }

    qrCode.lastScanned = new Date()
    qrCode.scanCount += 1
    await qrCode.save()

    const menuItems = await MenuItem.find({ resID, isAvailable: true }).sort({ category: 1, name: 1 })
    const menuByCategory = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push({
        menuID: item.menuID,
        name: item.name,
        description: item.description,
        // Backward compatible price field mapped from basePrice
        price: item.basePrice,
        basePrice: item.basePrice,
        variants: item.variants,
        image: item.image,
        ingredients: item.ingredients,
        allergens: item.allergens,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        isSpecialItem: item.isSpecialItem,
        taxPercentage: item.taxPercentage,
        preparationTime: item.preparationTime,
      })
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        restaurant: {
          resID: restaurant.resID,
          name: restaurant.name,
          location: restaurant.location,
          businessType: restaurant.businessType,
          contactInfo: restaurant.contactInfo,
          gstNumber: restaurant.gstNumber,
        },
        qrCode: {
          qrID: qrCode.qrID,
          type: qrCode.type,
          description: qrCode.description,
        },
        menu: menuByCategory,
        categories: Object.keys(menuByCategory),
      },
    })
  } catch (error) {
    console.error("Get public menu error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Get menu items by category (public API)
router.get("/:resID/:qrID/category/:categoryName", async (req, res) => {
  try {
    const { resID, qrID, categoryName } = req.params

    // Verify restaurant exists
    const restaurant = await Restaurant.findOne({ resID, isActive: true })
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found or inactive" })
    }

    // Verify QR code exists
    const qrCode = await QRCode.findOne({ qrID, resID, isActive: true })
    if (!qrCode) {
      return res.status(404).json({ success: false, message: "QR code not found or inactive" })
    }

    // Get items of the given category
    const menuItems = await MenuItem.find({
      resID,
      category: categoryName,
      isAvailable: true,
    }).sort({ name: 1 })

    if (!menuItems.length) {
      return res.status(404).json({ success: false, message: "No items found in this category" })
    }

    res.json({
      success: true,
      data: {
        restaurant: {
          resID: restaurant.resID,
          name: restaurant.name,
          location: restaurant.location,
          businessType: restaurant.businessType,
        },
        qrCode: {
          qrID: qrCode.qrID,
          type: qrCode.type,
        },
        category: categoryName,
        items: menuItems.map((item) => ({
          menuID: item.menuID,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          ingredients: item.ingredients,
          allergens: item.allergens,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          preparationTime: item.preparationTime,
        })),
      },
    })
  } catch (error) {
    console.error("Get menu items by category error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})


module.exports = router
