const express = require("express")
const { body, validationResult } = require("express-validator")
const Category = require("../models/Category")
const MenuItem = require("../models/Menu")
const { authenticateSubAdmin, verifyRestaurantAccess } = require("../middleware/auth")
const { generateCategoryID } = require("../utils/helpers")

const router = express.Router()

// Validation middleware for category
const categoryValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),
]

// Get all categories for a restaurant
router.get("/subadmin/:resID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const { includeInactive = false } = req.query

    const query = { resID }
    if (!includeInactive) {
      query.isActive = true
    }

    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 })

    // Get item count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const itemCount = await MenuItem.countDocuments({
          resID,
          category: category.name,
          isAvailable: true
        })
        return {
          ...category.toObject(),
          itemCount
        }
      })
    )

    res.json({
      success: true,
      data: categoriesWithCount,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Create new category
router.post("/subadmin/:resID", authenticateSubAdmin, verifyRestaurantAccess, categoryValidation, async (req, res) => {
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
    const categoryData = req.body

    // Check if category name already exists for this restaurant
    const existingCategory = await Category.findOne({
      resID,
      name: categoryData.name,
    })

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      })
    }

    const category = new Category({
      categoryID: generateCategoryID(),
      resID,
      ...categoryData,
    })

    await category.save()

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    })
  } catch (error) {
    console.error("Create category error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Update category
router.put("/subadmin/:resID/:categoryID", authenticateSubAdmin, verifyRestaurantAccess, categoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { resID, categoryID } = req.params
    const updateData = req.body

    // Check if new name conflicts with existing categories (excluding current one)
    if (updateData.name) {
      const existingCategory = await Category.findOne({
        resID,
        name: updateData.name,
        categoryID: { $ne: categoryID },
      })

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        })
      }
    }

    const category = await Category.findOneAndUpdate(
      { categoryID, resID },
      updateData,
      { new: true, runValidators: true }
    )

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" })
    }

    // If category name changed, update all menu items with this category
    if (updateData.name && updateData.name !== category.name) {
      await MenuItem.updateMany(
        { resID, category: category.name },
        { category: updateData.name }
      )
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    })
  } catch (error) {
    console.error("Update category error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Toggle category active status
router.patch("/subadmin/:resID/:categoryID/toggle-status", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, categoryID } = req.params

    const category = await Category.findOne({ categoryID, resID })
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" })
    }

    category.isActive = !category.isActive
    await category.save()

    res.json({
      success: true,
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      data: { categoryID: category.categoryID, isActive: category.isActive },
    })
  } catch (error) {
    console.error("Toggle category status error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Delete category
router.delete("/subadmin/:resID/:categoryID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, categoryID } = req.params

    // Check if category has menu items
    const itemCount = await MenuItem.countDocuments({
      resID,
      categoryID,
    })

    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${itemCount} menu item(s). Please move or delete the items first.`,
      })
    }

    const category = await Category.findOneAndDelete({ categoryID, resID })
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" })
    }

    res.json({ success: true, message: "Category deleted successfully" })
  } catch (error) {
    console.error("Delete category error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

// Reorder categories
router.patch("/subadmin/:resID/reorder", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const { categoryOrders } = req.body // Array of { categoryID, sortOrder }

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        message: "categoryOrders must be an array",
      })
    }

    // Update sort orders
    const updatePromises = categoryOrders.map(({ categoryID, sortOrder }) =>
      Category.findOneAndUpdate(
        { categoryID, resID },
        { sortOrder },
        { new: true }
      )
    )

    await Promise.all(updatePromises)

    res.json({
      success: true,
      message: "Categories reordered successfully",
    })
  } catch (error) {
    console.error("Reorder categories error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

module.exports = router
