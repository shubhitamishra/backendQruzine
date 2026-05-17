// Database seeding script for development and testing

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Import models
const Restaurant = require("../models/Restaurant")
const MenuItem = require("../models/Menu")
const QRCode = require("../models/QRCode")
const Order = require("../models/Order")
const User = require("../models/User")

// Import utilities
const { generateResID, generateMenuID, generateQRID, generateOrderID } = require("../utils/helpers")
const { generateQRCodeImage, generateMenuURL } = require("../utils/qrGenerator")

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-ordering")
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await Promise.all([
      Restaurant.deleteMany({}),
      MenuItem.deleteMany({}),
      QRCode.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
    ])
    console.log("🧹 Cleared existing data")

    // Create sample restaurants
    const restaurants = []
    const restaurantData = [
      {
        name: "The Golden Spoon",
        location: "123 Main Street, Downtown",
        businessType: "Restaurant",
        gstNumber: "GST123456789",
        contactInfo: {
          phone: "+1234567890",
          email: "admin@goldenspoon.com",
          website: "www.goldenspoon.com",
        },
      },
      {
        name: "Ocean View Hotel",
        location: "456 Beach Road, Seaside",
        businessType: "Hotel",
        gstNumber: "GST987654321",
        contactInfo: {
          phone: "+0987654321",
          email: "manager@oceanview.com",
          website: "www.oceanview.com",
        },
      },
      {
        name: "Cozy Cafe Corner",
        location: "789 Park Avenue, Uptown",
        businessType: "Restaurant",
        contactInfo: {
          phone: "+1122334455",
          email: "hello@cozycafe.com",
        },
      },
    ]

    for (const data of restaurantData) {
      const resID = generateResID()
      const adminId = `admin_${resID.toLowerCase()}`
      const password = "password123"
      const hashedPassword = await bcrypt.hash(password, 10)

      const restaurant = new Restaurant({
        resID,
        ...data,
        credentials: {
          adminId,
          password: hashedPassword,
        },
      })

      await restaurant.save()
      restaurants.push({ ...restaurant.toObject(), plainPassword: password })
      console.log(`✅ Created restaurant: ${data.name} (${resID})`)
    }

    // Create sample menu items for each restaurant
    const menuCategories = ["Appetizers", "Main Course", "Desserts", "Beverages"]
    const sampleMenuItems = {
      Appetizers: [
        { name: "Caesar Salad", description: "Fresh romaine lettuce with parmesan", price: 12.99, isVegetarian: true },
        { name: "Chicken Wings", description: "Spicy buffalo wings with ranch", price: 15.99, preparationTime: 15 },
        { name: "Garlic Bread", description: "Toasted bread with garlic butter", price: 8.99, isVegetarian: true },
      ],
      "Main Course": [
        { name: "Grilled Salmon", description: "Fresh Atlantic salmon with herbs", price: 28.99, preparationTime: 25 },
        {
          name: "Beef Steak",
          description: "Premium ribeye steak cooked to perfection",
          price: 35.99,
          preparationTime: 30,
        },
        {
          name: "Vegetarian Pasta",
          description: "Penne with seasonal vegetables",
          price: 18.99,
          isVegetarian: true,
          isVegan: true,
        },
      ],
      Desserts: [
        { name: "Chocolate Cake", description: "Rich chocolate layer cake", price: 9.99, isVegetarian: true },
        { name: "Ice Cream Sundae", description: "Vanilla ice cream with toppings", price: 7.99, isVegetarian: true },
      ],
      Beverages: [
        {
          name: "Fresh Orange Juice",
          description: "Freshly squeezed orange juice",
          price: 5.99,
          isVegetarian: true,
          isVegan: true,
        },
        { name: "Coffee", description: "Premium roasted coffee", price: 3.99, isVegetarian: true, isVegan: true },
        { name: "Craft Beer", description: "Local brewery selection", price: 6.99 },
      ],
    }

    for (const restaurant of restaurants) {
      for (const category of menuCategories) {
        const items = sampleMenuItems[category] || []
        for (const itemData of items) {
          const menuItem = new MenuItem({
            menuID: generateMenuID(),
            resID: restaurant.resID,
            category,
            ...itemData,
          })
          await menuItem.save()
        }
      }
      console.log(`✅ Created menu items for ${restaurant.name}`)
    }

    // Create sample QR codes for each restaurant
    const qrTypes = ["Table 1", "Table 2", "Table 3", "Room 101", "Room 102", "Counter"]

    for (const restaurant of restaurants) {
      const qrCount = restaurant.businessType === "Hotel" ? 5 : 6
      for (let i = 0; i < qrCount; i++) {
        const qrID = generateQRID()
        const type = restaurant.businessType === "Hotel" ? `Room ${101 + i}` : `Table ${i + 1}`
        const menuURL = generateMenuURL(restaurant.resID, qrID)
        const qrCodeImage = await generateQRCodeImage(menuURL)

        const qrCode = new QRCode({
          qrID,
          resID: restaurant.resID,
          type,
          description: `${type} - ${restaurant.name}`,
          qrCodeData: qrCodeImage,
        })

        await qrCode.save()
      }
      console.log(`✅ Created QR codes for ${restaurant.name}`)
    }

    // Create sample orders and users
    const sampleCustomers = [
      { name: "John Doe", phone: "+1234567890", email: "john.doe@email.com" },
      { name: "Jane Smith", phone: "+0987654321", email: "jane.smith@email.com" },
      { name: "Mike Johnson", phone: "+1122334455", email: "mike.johnson@email.com" },
      { name: "Sarah Wilson", phone: "+5566778899", email: "sarah.wilson@email.com" },
    ]

    const orderStatuses = ["Pending", "Accepted", "Processing", "Cooked", "Delivered"]
    const paymentStatuses = ["Pending", "Paid"]

    for (const restaurant of restaurants) {
      // Get menu items and QR codes for this restaurant
      const menuItems = await MenuItem.find({ resID: restaurant.resID })
      const qrCodes = await QRCode.find({ resID: restaurant.resID })

      // Create 10 sample orders for each restaurant
      for (let i = 0; i < 10; i++) {
        const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)]
        const qrCode = qrCodes[Math.floor(Math.random() * qrCodes.length)]
        const orderItemsCount = Math.floor(Math.random() * 3) + 1 // 1-3 items per order

        const orderItems = []
        let totalAmount = 0

        for (let j = 0; j < orderItemsCount; j++) {
          const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)]
          const quantity = Math.floor(Math.random() * 3) + 1
          const itemTotal = menuItem.price * quantity

          orderItems.push({
            menuID: menuItem.menuID,
            name: menuItem.name,
            price: menuItem.price,
            quantity,
            specialInstructions: Math.random() > 0.7 ? "Extra spicy" : "",
          })

          totalAmount += itemTotal
        }

        const order = new Order({
          orderID: generateOrderID(),
          resID: restaurant.resID,
          qrID: qrCode.qrID,
          customer,
          items: orderItems,
          totalAmount,
          status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
          specialRequest: Math.random() > 0.8 ? "Please deliver quickly" : "",
          estimatedTime: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        })

        await order.save()

        // Create or update user record
        const existingUser = await User.findOne({ email: customer.email, resID: restaurant.resID })
        if (existingUser) {
          existingUser.orderCount += 1
          existingUser.lastOrderDate = order.createdAt
          await existingUser.save()
        } else {
          const user = new User({
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            location: qrCode.type,
            resID: restaurant.resID,
            orderCount: 1,
            lastOrderDate: order.createdAt,
          })
          await user.save()
        }
      }
      console.log(`✅ Created sample orders for ${restaurant.name}`)
    }

    console.log("\n🎉 Database seeding completed successfully!")
    console.log("\n📋 Summary:")
    console.log(`   • ${restaurants.length} restaurants created`)
    console.log(`   • ${await MenuItem.countDocuments()} menu items created`)
    console.log(`   • ${await QRCode.countDocuments()} QR codes created`)
    console.log(`   • ${await Order.countDocuments()} orders created`)
    console.log(`   • ${await User.countDocuments()} users created`)

    console.log("\n🔑 Restaurant Admin Credentials:")
    for (const restaurant of restaurants) {
      console.log(`   ${restaurant.name}:`)
      console.log(`     Admin ID: ${restaurant.credentials.adminId}`)
      console.log(`     Password: ${restaurant.plainPassword}`)
      console.log(`     Restaurant ID: ${restaurant.resID}`)
      console.log("")
    }

    console.log("🔑 Super Admin Credentials:")
    console.log(`   Admin ID: ${process.env.SUPER_ADMIN_ID || "superadmin"}`)
    console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD || "admin123"}`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
}

module.exports = seedDatabase
