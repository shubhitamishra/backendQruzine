const mongoose = require("mongoose")

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // e.g., "Half", "Full", "Small", "Medium", "Large", "Extra Large", "250ml", "500gm"
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    trim: true, // Optional description for the variant
  }
}, { _id: false })

const menuItemSchema = new mongoose.Schema({
  menuID: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  resID: {
    type: String,
    required: true,
    ref: "Restaurant",
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Base price (used when no variants are defined)
  basePrice: {
    type: Number,
    min: 0,
    default: 0,
  },
  // Variants for different sizes/portions
  variants: [variantSchema],
  // Category reference
  categoryID: {
    type: String,
    ref: "Category",
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String, // Cloudinary URL
    default: null,
  },
  ingredients: [
    {
      type: String,
      trim: true,
    },
  ],
  allergens: [
    {
      type: String,
      trim: true,
    },
  ],
  isVegetarian: {
    type: Boolean,
    default: false,
  },
  isVegan: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isSpecialItem: {
    type: Boolean,
    default: false,
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 5;
      },
      message: 'Rating must be between 0 and 5'
    }
  },
  taxPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field before saving
menuItemSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Compound index for restaurant and menu item
menuItemSchema.index({ resID: 1, category: 1 })

module.exports = mongoose.model("MenuItem", menuItemSchema)