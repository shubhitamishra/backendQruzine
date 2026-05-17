const { body } = require("express-validator")

// Restaurant validation rules
const restaurantValidation = [
  body("name").trim().notEmpty().withMessage("Restaurant name is required"),
  
  // Location validations
  body("location.address").trim().notEmpty().withMessage("Address is required"),
  body("location.state").trim().notEmpty().withMessage("State is required"),
  body("location.city").trim().notEmpty().withMessage("City is required"),
  body("location.area").optional().trim(), // ✅ area is optional now
  body("location.pincode")
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be 6 digits"),
  
  body("businessType")
    .isIn(["Restaurant","Cafe","Hotel", "Other"])
    .withMessage("Invalid business type"),
  
  // GST number validation - now required
  body("gstNumber")
    .notEmpty().withMessage("GST number is required")
    .trim()
    .isLength({ min: 15, max: 15 })
    .withMessage("GST number must be 15 characters")
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage("Invalid GST number format"),
  
  body("contactInfo.phone").optional().trim(),
  body("contactInfo.email").optional().isEmail().withMessage("Invalid email format"),
  body("contactInfo.website").optional().trim(),
];


// Menu item validation rules
const menuItemValidation = [
  body("name").trim().notEmpty().withMessage("Item name is required"),
  body("description").optional().trim(),
  body("price").isInt({ min: 0 }).withMessage("Price must be a positive whole number (in rupees)"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("ingredients").optional().isArray(),
  body("allergens").optional().isArray(),
  body("isVegetarian").optional().isBoolean(),
  body("isVegan").optional().isBoolean(),
  body("isSpecialItem").optional().isBoolean(),
  body("preparationTime").optional().isInt({ min: 1 }).withMessage("Preparation time must be at least 1 minute"),
  body("rating").optional().isFloat({ min: 0, max: 5 }).withMessage("Rating must be between 0 and 5"),
  body("taxPercentage").isFloat({ min: 0, max: 100 }).withMessage("Tax percentage must be between 0 and 100"),
]
// Order validation rules
const orderValidation = [
  body("customer.name").trim().notEmpty().withMessage("Customer name is required"),
  body("customer.phone").trim().notEmpty().withMessage("Customer phone is required"),
  body("customer.email").isEmail().withMessage("Valid email is required"),
  body("customer.age").optional().isInt({ min: 1, max: 120 }).withMessage("Age must be between 1 and 120"),
  body("customer.dob").optional().isISO8601().withMessage("DOB must be a valid date"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.menuID").notEmpty().withMessage("Menu ID is required for each item"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("specialRequest").optional().trim(),
]

// QR code validation rules
const qrCodeValidation = [
  body("type").trim().notEmpty().withMessage("QR code type is required (table/room number)"),
  body("description").optional().trim(),
]

module.exports = {
  restaurantValidation,
  menuItemValidation,
  orderValidation,
  qrCodeValidation,
}
