const createCsvWriter = require("csv-writer").createObjectCsvWriter
const fs = require("fs").promises
const path = require("path")

// Export user data to CSV
const exportUserDataToCSV = async (users, restaurantName, filePath) => {
  try {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "name", title: "Customer Name" },
        { id: "phone", title: "Phone Number" },
        { id: "email", title: "Email Address" },
        { id: "age", title: "Age" },
        { id: "dob", title: "Date of Birth" },
        { id: "location", title: "Table/Room Location" },
        { id: "orderCount", title: "Total Orders" },
        { id: "lastOrderDate", title: "Last Order Date" },
        { id: "createdAt", title: "First Order Date" },
      ],
    })

    // Format data for CSV
    const formattedData = users.map((user) => ({
      ...user.toObject(),
      age: user.age ?? "",
      dob: user.dob ? new Date(user.dob).toLocaleDateString() : "",
      lastOrderDate: user.lastOrderDate ? user.lastOrderDate.toLocaleDateString() : "N/A",
      createdAt: user.createdAt ? user.createdAt.toLocaleDateString() : "N/A",
    }))

    await csvWriter.writeRecords(formattedData)
    return { success: true, filePath }
  } catch (error) {
    console.error("CSV export error:", error)
    return { success: false, error: error.message }
  }
}

// Export orders data to CSV
const exportOrdersToCSV = async (orders, restaurantName, filePath) => {
  try {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "orderID", title: "Order ID" },
        { id: "customerName", title: "Customer Name" },
        { id: "customerPhone", title: "Phone" },
        { id: "customerEmail", title: "Email" },
        { id: "customerAge", title: "Age" },
        { id: "customerDOB", title: "Date of Birth" },
        { id: "qrID", title: "Table/Room" },
        { id: "totalAmount", title: "Total Amount (₹)" },
        { id: "status", title: "Status" },
        { id: "paymentStatus", title: "Payment Status" },
        { id: "createdAt", title: "Order Date" },
        { id: "itemsCount", title: "Items Count" },
        { id: "specialRequest", title: "Special Request" },
      ],
    })

    // Format data for CSV
    const formattedData = orders.map((order) => ({
      orderID: order.orderID,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email,
      customerAge: order.customer.age ?? "",
      customerDOB: order.customer.dob ? new Date(order.customer.dob).toLocaleDateString() : "",
      qrID: order.qrID,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toLocaleDateString(),
      itemsCount: order.items.length,
      specialRequest: order.specialRequest || "None",
    }))

    await csvWriter.writeRecords(formattedData)
    return { success: true, filePath }
  } catch (error) {
    console.error("Orders CSV export error:", error)
    return { success: false, error: error.message }
  }
}

// Export menu data to CSV
const exportMenuToCSV = async (menuItems, restaurantName, filePath) => {
  try {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "menuID", title: "Menu ID" },
        { id: "name", title: "Item Name" },
        { id: "category", title: "Category" },
        { id: "price", title: "Price (₹)" },
        { id: "description", title: "Description" },
        { id: "isVegetarian", title: "Vegetarian" },
        { id: "isVegan", title: "Vegan" },
        { id: "isAvailable", title: "Available" },
        { id: "preparationTime", title: "Prep Time (min)" },
        { id: "createdAt", title: "Added Date" },
      ],
    })

    // Format data for CSV
    const formattedData = menuItems.map((item) => ({
      ...item.toObject(),
      isVegetarian: item.isVegetarian ? "Yes" : "No",
      isVegan: item.isVegan ? "Yes" : "No",
      isAvailable: item.isAvailable ? "Yes" : "No",
      createdAt: item.createdAt.toLocaleDateString(),
      ingredients: item.ingredients ? item.ingredients.join(", ") : "",
      allergens: item.allergens ? item.allergens.join(", ") : "",
    }))

    await csvWriter.writeRecords(formattedData)
    return { success: true, filePath }
  } catch (error) {
    console.error("Menu CSV export error:", error)
    return { success: false, error: error.message }
  }
}

// Generate comprehensive restaurant report
const generateRestaurantReport = async (restaurantData, reportData) => {
  try {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Restaurant Report - ${restaurantData.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; }
          .section { margin: 30px 0; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
          .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #2c5aa0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Restaurant Performance Report</h1>
          <h2>${restaurantData.name}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h3>Overview Statistics</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${reportData.totalOrders}</div>
              <div>Total Orders</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">₹${reportData.totalRevenue.toFixed(2)}</div>
              <div>Total Revenue</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.totalCustomers}</div>
              <div>Total Customers</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">₹${reportData.averageOrderValue.toFixed(2)}</div>
              <div>Avg Order Value</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Popular Menu Items</h3>
          <table>
            <thead>
              <tr><th>Item Name</th><th>Orders</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              ${reportData.popularItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.orderCount}</td>
                  <td>₹${item.revenue.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Order Status Breakdown</h3>
          <table>
            <thead>
              <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              ${reportData.statusBreakdown
                .map(
                  (status) => `
                <tr>
                  <td>${status.status}</td>
                  <td>${status.count}</td>
                  <td>${status.percentage.toFixed(1)}%</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `

    return reportHTML
  } catch (error) {
    console.error("Report generation error:", error)
    throw new Error("Failed to generate restaurant report")
  }
}

// Clean up temporary files
const cleanupTempFiles = async (filePaths) => {
  try {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath)
        console.log(`Cleaned up temp file: ${filePath}`)
      } catch (error) {
        console.error(`Failed to cleanup file ${filePath}:`, error.message)
      }
    }
  } catch (error) {
    console.error("Cleanup error:", error)
  }
}

module.exports = {
  exportUserDataToCSV,
  exportOrdersToCSV,
  exportMenuToCSV,
  generateRestaurantReport,
  cleanupTempFiles,
}
