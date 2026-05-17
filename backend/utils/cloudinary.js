const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
const config = cloudinary.config();
// console.log('Cloudinary configured with cloud_name:', config.cloud_name ? 'SET' : 'NOT SET');

// Configure multer storage for Cloudinary (images for menu items)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'restaurant-menu', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image',
  },
});

// Separate storage for banners (images)
const bannerImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'qruzine-banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1600, height: 400, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image',
  },
});

// Separate storage for banners (videos)
const bannerVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'qruzine-banners',
    allowed_formats: ['mp4', 'webm', 'mov'],
    resource_type: 'video',
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload single image (menu items)
const uploadSingle = upload.single('image');

// Upload single banner image
const uploadBannerImage = multer({
  storage: bannerImageStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
}).single('banner');

// Upload single banner video
const uploadBannerVideo = multer({
  storage: bannerVideoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed!'), false);
  },
}).single('banner');

// Upload multiple images
const uploadMultiple = upload.array('images', 5);

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  if (!url) return null;
  
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  
  // Include folder path if present
  const folders = ['restaurant-menu', 'qruzine-banners'];
  for (const folder of folders) {
    const idx = parts.indexOf(folder);
    if (idx !== -1) {
      return `${folder}/${publicId}`;
    }
  }
  
  return publicId;
};

// Optimize image URL
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    width: 400,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, finalOptions);
};

module.exports = {
  cloudinary,
  uploadSingle,
  uploadBannerImage,
  uploadBannerVideo,
  uploadMultiple,
  deleteImage,
  extractPublicId,
  getOptimizedUrl,
};
