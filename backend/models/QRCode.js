const mongoose = require("mongoose")

const qrCodeSchema = new mongoose.Schema({
  qrID: {
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
  type: {
    type: String,
    required: true, // Room number, Table number, etc.
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  qrCodeData: {
    type: String, // Base64 encoded QR code image
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastScanned: {
    type: Date,
  },
  scanCount: {
    type: Number,
    default: 0,
  },
})

// Compound index for restaurant and QR code
qrCodeSchema.index({ resID: 1, qrID: 1 })

module.exports = mongoose.model("QRCode", qrCodeSchema)
