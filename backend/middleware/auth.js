const jwt = require("jsonwebtoken")
const Restaurant = require("../models/Restaurant")

// Super Admin authentication
const authenticateSuperAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" })
    if (user.role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorized" })
    }
    req.user = user
    next()
  })
}

// Sub Admin (Restaurant) authentication
const authenticateSubAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const restaurant = await Restaurant.findOne({
      resID: decoded.resID,
      "credentials.adminId": decoded.adminId,
    })

    if (!restaurant || !restaurant.isActive) {
      return res.status(401).json({ message: "Invalid token or restaurant not found" })
    }

    req.user = {
      role: "subadmin",
      resID: decoded.resID,
      adminId: decoded.adminId,
      restaurant: restaurant,
    }

    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" })
  }
}

// Verify restaurant access
const verifyRestaurantAccess = (req, res, next) => {
  const { resID } = req.params

  if (req.user.role === "superadmin") {
    next()
  } else if (req.user.role === "subadmin" && req.user.resID === resID) {
    next()
  } else {
    return res.status(403).json({ message: "Access denied to this restaurant" })
  }
}

module.exports = {
  authenticateSuperAdmin,
  authenticateSubAdmin,
  verifyRestaurantAccess,
}
