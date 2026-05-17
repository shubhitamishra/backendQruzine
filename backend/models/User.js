const mongoose = require("mongoose")

// This model stores minimal user data for super admin export
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  location: {
    type: String, // This will be the QR location/table info
    required: true,
    trim: true,
  },
  resID: {
    type: String,
    required: true,
    ref: "Restaurant",
  },
  age: {
    type: Number,
    min: 1,
    max: 120,
  },
  dob: {
    type: Date,
  },
  orderCount: {
    type: Number,
    default: 1,
  },
  lastOrderDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Compound index for restaurant and user data
userSchema.index({ resID: 1, email: 1 })

module.exports = mongoose.model("User", userSchema)
