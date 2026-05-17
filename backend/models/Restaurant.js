// Updated Restaurant Schema
const mongoose = require("mongoose")

const restaurantSchema = new mongoose.Schema({
  resID: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    }
  },
  businessType: {
    type: String,
    enum: ["Restaurant", "Hotel","Cafe","Fast Food","Fine Dining","Bar","Food Truck","Other"],
    required: true,
  },
  gstNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        // GST number validation pattern (15 characters)
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
      },
      message: 'Invalid GST number format'
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String,
  },
  credentials: {
    adminId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
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
restaurantSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Restaurant", restaurantSchema)