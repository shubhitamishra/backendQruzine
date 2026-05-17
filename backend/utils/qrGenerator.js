const QRCode = require("qrcode")
const { generateBrandedQRCode, generateQRWithLogo, generateSimpleQR } = require('./awesomeQrGenerator')

// Generate QR code image with restaurant branding
const generateQRCodeImage = async (data, restaurantName = "Restaurant", options = {}) => {
  try {
    // Try to generate branded QR code first
    if (restaurantName && restaurantName !== "Restaurant") {
      try {
        return await generateBrandedQRCode(data, restaurantName, options)
      } catch (brandingError) {
        console.warn("Branded QR generation failed, falling back to simple QR:", brandingError.message)
      }
    }

    // Fallback to awesome-qr simple generation
    try {
      return await generateSimpleQR(data, options)
    } catch (awesomeError) {
      console.warn("Awesome QR generation failed, falling back to basic QR:", awesomeError.message)
    }

    // Final fallback to basic qrcode library
    const defaultOptions = {
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
      ...options,
    }

    const qrCodeDataURL = await QRCode.toDataURL(data, defaultOptions)
    return qrCodeDataURL
  } catch (error) {
    console.error("QR code generation error:", error)
    throw new Error("Failed to generate QR code")
  }
}

// Generate QR code as buffer
const generateQRCodeBuffer = async (data, options = {}) => {
  try {
    const defaultOptions = {
      type: "png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
      ...options,
    }

    const qrCodeBuffer = await QRCode.toBuffer(data, defaultOptions)
    return qrCodeBuffer
  } catch (error) {
    console.error("QR code buffer generation error:", error)
    throw new Error("Failed to generate QR code buffer")
  }
}

// Generate menu URL for QR code
const generateMenuURL = (resID, qrID, baseURL = process.env.FRONTEND_URL || "http://localhost:3000") => {
  return `${baseURL}/menu/${resID}/${qrID}`
}

module.exports = {
  generateQRCodeImage,
  generateQRCodeBuffer,
  generateMenuURL,
}
