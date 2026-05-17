const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
  categoryID: {
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
  image: {
    type: String, // Cloudinary URL
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
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
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Compound index for restaurant and category
categorySchema.index({ resID: 1, name: 1 }, { unique: true })

module.exports = mongoose.model("Category", categorySchema)
