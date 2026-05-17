const { v4: uuidv4 } = require("uuid")
const bcrypt = require("bcryptjs")

// Generate unique IDs
const generateResID = () => {
  return "RES_" + uuidv4().substring(0, 8).toUpperCase()
}

const generateQRID = () => {
  return "QR_" + uuidv4().substring(0, 8).toUpperCase()
}

const generateMenuID = () => {
  return "MENU_" + uuidv4().substring(0, 8).toUpperCase()
}

const generateOrderID = () => {
  return "ORD_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8).toUpperCase()
}

const generateCategoryID = () => {
  return "CAT_" + uuidv4().substring(0, 8).toUpperCase()
}

// Generate random password
const generatePassword = (length = 8) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone format (basic)
const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
}

// Calculate estimated preparation time
const calculateEstimatedTime = (items) => {
  if (!items || items.length === 0) return 15

  const totalTime = items.reduce((total, item) => {
    return total + (item.preparationTime || 15) * item.quantity
  }, 0)

  // Add base time and consider kitchen efficiency
  return Math.max(15, Math.ceil(totalTime * 0.8))
}

module.exports = {
  generateResID,
  generateQRID,
  generateMenuID,
  generateOrderID,
  generateCategoryID,
  generatePassword,
  hashPassword,
  comparePassword,
  isValidEmail,
  isValidPhone,
  calculateEstimatedTime,
}
