const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
  menuID: {
    type: String,
    required: true,
    ref: "MenuItem",
  },
  variantName: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  specialInstructions: {
    type: String,
    trim: true,
  },
})

const orderSchema = new mongoose.Schema({
  orderID: {
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
  qrID: {
    type: String,
    required: true,
    ref: "QRCode",
  },
  customer: {
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
    age: {
      type: Number,
      min: 1,
      max: 120,
    },
    dob: {
      type: Date,
    },
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  specialRequest: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Processing", "Cooked", "Delivered", "Cancelled"],
    default: "Pending",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending",
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 30,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  statusHistory: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
    },
  ],
})

// Update the updatedAt field before saving
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Add status to history when status changes
orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    })
  }
  next()
})

// Compound indexes for efficient queries
orderSchema.index({ resID: 1, createdAt: -1 })
orderSchema.index({ resID: 1, status: 1 })
orderSchema.index({ qrID: 1, createdAt: -1 })

module.exports = mongoose.model("Order", orderSchema)
