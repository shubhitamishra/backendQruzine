const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    placement: {
      type: String,
      enum: ['all', 'menu', 'cart', 'checkout'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
    metadata: {
      width: Number,
      height: Number,
      duration: Number,
      publicId: String,
      format: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', BannerSchema);
