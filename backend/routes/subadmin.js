const express = require("express")
const { body, validationResult } = require("express-validator")
const Restaurant = require("../models/Restaurant")
const Order = require("../models/Order")
const MenuItem = require("../models/Menu")
const QRCode = require("../models/QRCode")
const { sendOrderStatusUpdate } = require("../utils/emailService")
const { sendOrderStatusWhatsApp } = require("../utils/whatsappService")
const { authenticateSubAdmin, verifyRestaurantAccess } = require("../middleware/auth")

const router = express.Router()

// Get restaurant dashboard overview
router.get("/:resID/dashboard", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    // Get statistics
    const totalOrders = await Order.countDocuments({ resID })
    const todayOrders = await Order.countDocuments({
      resID,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })

    const activeOrders = await Order.countDocuments({
      resID,
      status: { $in: ["Pending", "Accepted", "Processing", "Cooked"] },
    })

    const completedOrders = await Order.countDocuments({
      resID,
      status: "Delivered",
    })

    // Revenue statistics
    const totalRevenue = await Order.aggregate([
      { $match: { resID, status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          resID,
          status: "Delivered",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    // Menu and QR statistics
    const totalMenuItems = await MenuItem.countDocuments({ resID })
    const availableMenuItems = await MenuItem.countDocuments({ resID, isAvailable: true })
    const totalQRCodes = await QRCode.countDocuments({ resID })
    const activeQRCodes = await QRCode.countDocuments({ resID, isActive: true })

    // Recent orders
    const recentOrders = await Order.find({ resID })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderID customer.name qrID totalAmount status createdAt")

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $match: { resID } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    // Popular items (most ordered)
    const popularItems = await Order.aggregate([
      { $match: { resID } },
      { $unwind: "$items" },
      { $group: { _id: "$items.menuID", name: { $first: "$items.name" }, count: { $sum: "$items.quantity" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          active: activeOrders,
          completed: completedOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
        },
        menu: {
          total: totalMenuItems,
          available: availableMenuItems,
        },
        qrCodes: {
          total: totalQRCodes,
          active: activeQRCodes,
        },
        recentOrders,
        orderStatusBreakdown,
        popularItems,
      },
    })
  } catch (error) {
    console.error("Get dashboard overview error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get all orders for restaurant
router.get("/:resID/orders", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const { page = 1, limit = 20, status = "", qrID = "", date = "" } = req.query

    // Build query
    const query = { resID }
    if (status) query.status = status
    if (qrID) query.qrID = qrID
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      query.createdAt = { $gte: startDate, $lte: endDate }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Order.countDocuments(query)

    // Attach qrName (from QRCode.type/description)
    const qrCodes = await QRCode.find({ resID }).select("qrID type description")
    const qrMap = new Map(qrCodes.map(q => [q.qrID, q]))
    const mappedOrders = orders.map(o => {
      const obj = o.toObject()
      const q = qrMap.get(obj.qrID)
      return { ...obj, qrName: (q?.type || q?.description || obj.qrID) }
    })

    res.json({
      success: true,
      data: mappedOrders,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get orders error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update order status
router.patch("/:resID/orders/:orderID/status", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID, orderID } = req.params
    const { status, note } = req.body

    const validStatuses = ["Pending", "Accepted", "Processing", "Cooked", "Delivered", "Cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    const order = await Order.findOne({ orderID, resID })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    const previousStatus = order.status
    order.status = status
    if (note) {
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note,
      })
    }

    await order.save()

    // Notify customer (best-effort): email and WhatsApp when status actually changes
    if (previousStatus !== status) {
      try {
        await sendOrderStatusUpdate(order, status)
      } catch (emailError) {
        console.error("[Subadmin] Failed to send status update email:", emailError)
      }
      try {
        const [qr, restaurant] = await Promise.all([
          QRCode.findOne({ qrID: order.qrID }).select("type description"),
          Restaurant.findOne({ resID: order.resID }).select("name"),
        ])
        const orderForMsg = { ...order.toObject(), qrName: (qr?.type || qr?.description) }
        const waResult = await sendOrderStatusWhatsApp(orderForMsg, status, { restaurantName: restaurant?.name })
        if (waResult?.sid) {
          console.log("[Subadmin] Order status WhatsApp sent:", waResult.sid)
        } else if (waResult?.skipped) {
          console.warn("[Subadmin] Order status WhatsApp skipped (config/phone)")
        } else if (waResult?.error) {
          console.error("[Subadmin] Order status WhatsApp error:", waResult.error)
        }
      } catch (waError) {
        console.error("[Subadmin] Failed to send status update WhatsApp:", waError)
      }
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    })
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get menu items for restaurant
router.get("/:resID/menu", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const { category = "", available = "" } = req.query

    const query = { resID }
    if (category) query.category = category
    if (available !== "") query.isAvailable = available === "true"

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 })
    const categories = await MenuItem.distinct("category", { resID })

    res.json({
      success: true,
      data: {
        items: menuItems,
        categories,
        totalItems: menuItems.length,
      },
    })
  } catch (error) {
    console.error("Get menu items error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get QR codes for restaurant
router.get("/:resID/qr-codes", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params

    const qrCodes = await QRCode.find({ resID }).sort({ createdAt: -1 })

    res.json({
      success: true,
      data: qrCodes,
      totalCodes: qrCodes.length,
    })
  } catch (error) {
    console.error("Get QR codes error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
