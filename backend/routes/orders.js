const express = require("express")
const { body, validationResult } = require("express-validator")
const Order = require("../models/Order")
const MenuItem = require("../models/Menu")
const QRCode = require("../models/QRCode")
const Restaurant = require("../models/Restaurant")
const User = require("../models/User")
const { authenticateSubAdmin, verifyRestaurantAccess } = require("../middleware/auth")
const { generateOrderID, calculateEstimatedTime, isValidEmail, isValidPhone } = require("../utils/helpers")
const { sendOrderConfirmation, sendOrderStatusUpdate } = require("../utils/emailService")
const { sendOrderConfirmationWhatsApp, sendOrderStatusWhatsApp } = require("../utils/whatsappService")
const { orderValidation } = require("../utils/validation")
const { generateInvoiceHTML } = require("../utils/invoiceGenerator")

const router = express.Router()

// Place new order (public endpoint - no authentication required)
router.post("/place", orderValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { resID, qrID, customer, items, specialRequest } = req.body

    // Validate restaurant and QR code
    const restaurant = await Restaurant.findOne({ resID, isActive: true })
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or inactive",
      })
    }

    const qrCode = await QRCode.findOne({ qrID, resID, isActive: true })
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found or inactive",
      })
    }

    // Validate customer data
    if (!isValidEmail(customer.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      })
    }

    if (!isValidPhone(customer.phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      })
    }

    // Validate and process menu items
    const menuItemIds = items.map((item) => item.menuID)
    const uniqueMenuIds = [...new Set(menuItemIds)]
    const menuItems = await MenuItem.find({
      menuID: { $in: uniqueMenuIds },
      resID,
      isAvailable: true,
    })

    if (menuItems.length !== uniqueMenuIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some menu items are not available or not found",
      })
    }

    // Calculate total amount and prepare order items
    let totalAmount = 0
    const orderItems = items.map((orderItem) => {
      const menuItem = menuItems.find((mi) => mi.menuID === orderItem.menuID)

      // Determine unit price: use variant if provided and available; else basePrice
      let unitPrice = menuItem.basePrice || 0
      let variantName = orderItem.variantName || null
      if (variantName && Array.isArray(menuItem.variants) && menuItem.variants.length) {
        const variant = menuItem.variants.find(v => v.name === variantName && v.isAvailable !== false)
        if (variant) unitPrice = variant.price
      }

      const itemTotal = unitPrice * orderItem.quantity
      totalAmount += itemTotal

      return {
        menuID: menuItem.menuID,
        name: menuItem.name,
        variantName: variantName || undefined,
        price: unitPrice,
        quantity: orderItem.quantity,
        specialInstructions: orderItem.specialInstructions || "",
      }
    })

    // Calculate estimated preparation time
    const estimatedTime = calculateEstimatedTime(
      orderItems.map((item) => ({
        preparationTime: menuItems.find((mi) => mi.menuID === item.menuID)?.preparationTime || 15,
        quantity: item.quantity,
      })),
    )

    // Generate order ID
    const orderID = generateOrderID()

    // Create order
    const order = new Order({
      orderID,
      resID,
      qrID,
      customer,
      items: orderItems,
      totalAmount,
      specialRequest,
      estimatedTime,
      status: "Pending",
      paymentStatus: "Pending",
    })

    await order.save()

    // Store/update user data for super admin export
    const isGuestEmail = !customer.email || customer.email.toLowerCase() === "guest@example.com"
    const userQuery = isGuestEmail
      ? { phone: customer.phone, resID }
      : { email: customer.email, resID }
    const existingUser = await User.findOne(userQuery)
    if (existingUser) {
      existingUser.orderCount += 1
      existingUser.lastOrderDate = new Date()
      existingUser.location = qrCode.type // Update location to latest QR location
      // Persist optional birthday-related fields if provided
      if (customer.age !== undefined) existingUser.age = customer.age
      if (customer.dob) existingUser.dob = customer.dob
      // If previously stored via phone and we now have a real email, set it
      if (!isGuestEmail && !existingUser.email) existingUser.email = customer.email
      await existingUser.save()
    } else {
      const newUser = new User({
        name: customer.name,
        phone: customer.phone,
        email: isGuestEmail ? undefined : customer.email,
        location: qrCode.type,
        resID,
        orderCount: 1,
        age: customer.age,
        dob: customer.dob,
      })
      await newUser.save()
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmation({
        orderID: order.orderID,
        customer: order.customer,
        qrID: order.qrID,
        items: order.items,
        totalAmount: order.totalAmount,
        estimatedTime: order.estimatedTime,
        specialRequest: order.specialRequest,
      })
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError)
      // Don't fail the order if email fails
    }

    // Send WhatsApp confirmation (best-effort)
    try {
      const waResult = await sendOrderConfirmationWhatsApp({
        orderID: order.orderID,
        customer: order.customer,
        qrID: order.qrID,
        qrName: qrCode.type || qrCode.description,
        items: order.items,
        totalAmount: order.totalAmount,
        estimatedTime: order.estimatedTime,
        specialRequest: order.specialRequest,
        restaurantName: restaurant?.name,
      })
      if (waResult?.sid) {
        console.log("Order confirmation WhatsApp sent:", waResult.sid)
      } else if (waResult?.skipped) {
        console.warn("Order confirmation WhatsApp skipped (config/phone)")
      } else if (waResult?.error) {
        console.error("Order confirmation WhatsApp error:", waResult.error)
      }
    } catch (waError) {
      console.error("Failed to send order confirmation WhatsApp:", waError)
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        orderID: order.orderID,
        status: order.status,
        estimatedTime: order.estimatedTime,
        totalAmount: order.totalAmount,
        customer: order.customer,
        items: order.items,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error("Place order error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get order status (public endpoint - no authentication required)
router.get("/status/:orderID", async (req, res) => {
  try {
    const { orderID } = req.params

    const order = await Order.findOne({ orderID }).select(
      "orderID status paymentStatus estimatedTime totalAmount customer.name qrID statusHistory createdAt updatedAt",
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Get restaurant info
    const restaurant = await Restaurant.findOne({ resID: order.resID }).select("name location")

    res.json({
      success: true,
      data: {
        orderID: order.orderID,
        status: order.status,
        paymentStatus: order.paymentStatus,
        estimatedTime: order.estimatedTime,
        totalAmount: order.totalAmount,
        customerName: order.customer.name,
        qrID: order.qrID,
        restaurant: restaurant
          ? {
              name: restaurant.name,
              location: restaurant.location,
            }
          : null,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error("Get order status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get order details (public endpoint - no authentication required)
router.get("/details/:orderID", async (req, res) => {
  try {
    const { orderID } = req.params

    const order = await Order.findOne({ orderID })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Get restaurant and QR code info
    const restaurant = await Restaurant.findOne({ resID: order.resID }).select("name location businessType")
    const qrCode = await QRCode.findOne({ qrID: order.qrID }).select("type description")

    res.json({
      success: true,
      data: {
        ...order.toObject(),
        restaurant,
        qrCodeInfo: qrCode,
      },
    })
  } catch (error) {
    console.error("Get order details error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update order status (restaurant admin only)
router.patch("/:orderID/status", authenticateSubAdmin, async (req, res) => {
  try {
    const { orderID } = req.params
    const { status, note, estimatedTime } = req.body

    const validStatuses = ["Pending", "Accepted", "Processing", "Cooked", "Delivered", "Cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    const order = await Order.findOne({ orderID, resID: req.user.resID })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    const previousStatus = order.status
    order.status = status

    if (estimatedTime) {
      order.estimatedTime = estimatedTime
    }

    if (note) {
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note,
      })
    }

    await order.save()

    // Send status update email if status changed
    if (previousStatus !== status) {
      try {
        await sendOrderStatusUpdate(order, status)
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError)
        // Don't fail the update if email fails
      }
      // Also send WhatsApp update (best-effort)
      try {
        // Attach qrName for message context
        const [qr, restaurant] = await Promise.all([
          QRCode.findOne({ qrID: order.qrID }).select("type description"),
          Restaurant.findOne({ resID: order.resID }).select("name"),
        ])
        const orderForMsg = { ...order.toObject(), qrName: (qr?.type || qr?.description) }
        const waResult = await sendOrderStatusWhatsApp(orderForMsg, status, { restaurantName: restaurant?.name })
        if (waResult?.sid) {
          console.log("Order status WhatsApp sent:", waResult.sid)
        } else if (waResult?.skipped) {
          console.warn("Order status WhatsApp skipped (config/phone)")
        } else if (waResult?.error) {
          console.error("Order status WhatsApp error:", waResult.error)
        }
      } catch (waError) {
        console.error("Failed to send status update WhatsApp:", waError)
      }
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: {
        orderID: order.orderID,
        status: order.status,
        estimatedTime: order.estimatedTime,
        statusHistory: order.statusHistory,
      },
    })
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update payment status (restaurant admin only)
router.patch("/:orderID/payment", authenticateSubAdmin, async (req, res) => {
  try {
    const { orderID } = req.params
    const { paymentStatus, note } = req.body

    const validPaymentStatuses = ["Pending", "Paid", "Failed", "Refunded"]
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      })
    }

    const order = await Order.findOne({ orderID, resID: req.user.resID })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    order.paymentStatus = paymentStatus

    if (note) {
      order.statusHistory.push({
        status: `Payment: ${paymentStatus}`,
        timestamp: new Date(),
        note,
      })
    }

    await order.save()

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: {
        orderID: order.orderID,
        paymentStatus: order.paymentStatus,
        statusHistory: order.statusHistory,
      },
    })
  } catch (error) {
    console.error("Update payment status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get orders for restaurant (restaurant admin only)
router.get("/restaurant/:resID", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params
    const { page = 1, limit = 20, status = "", paymentStatus = "", qrID = "", date = "", search = "" } = req.query

    // Build query
    const query = { resID }
    if (status) query.status = status
    if (paymentStatus) query.paymentStatus = paymentStatus
    if (qrID) query.qrID = qrID
    if (search) {
      query.$or = [
        { orderID: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
        { "customer.email": { $regex: search, $options: "i" } },
      ]
    }
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

    // Get summary statistics
    const statusCounts = await Order.aggregate([
      { $match: { resID } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    const paymentCounts = await Order.aggregate([
      { $match: { resID } },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ])

    // Enrich with qrName (from QRCode.type/description)
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
      summary: {
        statusCounts,
        paymentCounts,
      },
    })
  } catch (error) {
    console.error("Get restaurant orders error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get active orders for kitchen display (restaurant admin only)
router.get("/restaurant/:resID/active", authenticateSubAdmin, verifyRestaurantAccess, async (req, res) => {
  try {
    const { resID } = req.params

    const activeOrders = await Order.find({
      resID,
      status: { $in: ["Pending", "Accepted", "Processing", "Cooked"] },
    })
      .sort({ createdAt: 1 }) // Oldest first for kitchen
      .select("orderID customer.name qrID items totalAmount status estimatedTime createdAt")

    // Group by status for kitchen display
    const ordersByStatus = {
      Pending: [],
      Accepted: [],
      Processing: [],
      Cooked: [],
    }

    // Attach qrName to active orders
    const activeQrCodes = await QRCode.find({ resID }).select("qrID type description")
    const activeQrMap = new Map(activeQrCodes.map(q => [q.qrID, q]))

    activeOrders.forEach((order) => {
      if (ordersByStatus[order.status]) {
        const obj = order.toObject()
        const q = activeQrMap.get(obj.qrID)
        ordersByStatus[order.status].push({ ...obj, qrName: (q?.type || q?.description || obj.qrID) })
      }
    })

    res.json({
      success: true,
      data: ordersByStatus,
      totalActiveOrders: activeOrders.length,
    })
  } catch (error) {
    console.error("Get active orders error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Cancel order (restaurant admin only)
router.patch("/:orderID/cancel", authenticateSubAdmin, async (req, res) => {
  try {
    const { orderID } = req.params
    const { reason } = req.body

    const order = await Order.findOne({ orderID, resID: req.user.resID })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order with current status",
      })
    }

    order.status = "Cancelled"
    order.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: reason || "Order cancelled by restaurant",
    })

    await order.save()

    // Send cancellation email
    try {
      await sendOrderStatusUpdate(order, "Cancelled")
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError)
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        orderID: order.orderID,
        status: order.status,
      },
    })
  } catch (error) {
    console.error("Cancel order error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Generate invoice for order (public endpoint)
router.get("/invoice/:orderID", async (req, res) => {
  try {
    const { orderID } = req.params
    const { format = "html" } = req.query

    const order = await Order.findOne({ orderID })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Get restaurant and QR code info
    const restaurant = await Restaurant.findOne({ resID: order.resID }).select("name location businessType")
    const qrCode = await QRCode.findOne({ qrID: order.qrID }).select("type description")

    const invoiceData = {
      ...order.toObject(),
      restaurant,
      qrCodeInfo: qrCode,
    }

    if (format === "html") {
      const invoiceHTML = generateInvoiceHTML(invoiceData)
      res.setHeader("Content-Type", "text/html")
      res.send(invoiceHTML)
    } else {
      // Return JSON data for frontend to generate PDF
      res.json({
        success: true,
        data: invoiceData,
      })
    }
  } catch (error) {
    console.error("Generate invoice error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
