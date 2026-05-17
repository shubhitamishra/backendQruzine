// Enhanced email templates for better formatting and branding

const getEmailHeader = (restaurantName = "Restaurant Ordering System") => `
  <div style="background-color: #2c5aa0; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">${restaurantName}</h1>
    <p style="margin: 5px 0 0 0; font-size: 14px;">Digital Ordering System</p>
  </div>
`

const getEmailFooter = () => `
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; margin-top: 30px;">
    <p style="margin: 0; color: #6c757d; font-size: 12px;">
      This is an automated message from the Restaurant Ordering System.<br>
      Please do not reply to this email.
    </p>
    <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">
      Generated on ${new Date().toLocaleString()}
    </p>
  </div>
`

const orderConfirmationTemplate = (orderData) => {
  const { orderID, customer, qrID, items, totalAmount, estimatedTime, specialRequest } = orderData

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - ${orderID}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      ${getEmailHeader()}
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #2c5aa0; margin-bottom: 20px;">Order Confirmation</h2>
        
        <p>Dear <strong>${customer.name}</strong>,</p>
        <p>Thank you for your order! We've received your request and our kitchen is preparing your delicious meal.</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #1976d2;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${orderID}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Table/Room:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${qrID}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Estimated Time:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${estimatedTime} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
              <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #2c5aa0;">₹${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="margin: 25px 0;">
          <h3 style="color: #2c5aa0;">Items Ordered</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
            ${items
              .map(
                (item) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <div>
                  <strong>${item.name}</strong> x ${item.quantity}
                  ${item.specialInstructions ? `<br><small style="color: #6c757d;">Note: ${item.specialInstructions}</small>` : ""}
                </div>
                <div style="font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>

        ${
          specialRequest
            ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
            <h4 style="margin-top: 0; color: #856404;">Special Request</h4>
            <p style="margin-bottom: 0;">${specialRequest}</p>
          </div>
        `
            : ""
        }

        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #155724;">Track Your Order</h3>
          <p style="margin-bottom: 15px;">Use your Order ID to track the status:</p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold; color: #2c5aa0;">
            ${orderID}
          </div>
        </div>

        <p>We'll notify you when your order status changes. Thank you for choosing us!</p>
      </div>

      ${getEmailFooter()}
    </body>
    </html>
  `
}

const statusUpdateTemplate = (orderData, newStatus) => {
  const statusMessages = {
    Accepted: { message: "Your order has been accepted and is being prepared.", color: "#17a2b8", icon: "✓" },
    Processing: { message: "Your order is currently being processed in the kitchen.", color: "#ffc107", icon: "🍳" },
    Cooked: { message: "Your order is ready! It will be delivered shortly.", color: "#28a745", icon: "🍽️" },
    Delivered: { message: "Your order has been delivered. Enjoy your meal!", color: "#28a745", icon: "✅" },
    Cancelled: { message: "Unfortunately, your order has been cancelled.", color: "#dc3545", icon: "❌" },
  }

  const statusInfo = statusMessages[newStatus] || { message: "Order status updated.", color: "#6c757d", icon: "ℹ️" }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - ${orderData.orderID}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      ${getEmailHeader()}
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #2c5aa0; margin-bottom: 20px;">Order Status Update</h2>
        
        <p>Dear <strong>${orderData.customer.name}</strong>,</p>
        
        <div style="background-color: ${statusInfo.color}15; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border-left: 4px solid ${statusInfo.color};">
          <div style="font-size: 48px; margin-bottom: 15px;">${statusInfo.icon}</div>
          <h3 style="margin: 0 0 15px 0; color: ${statusInfo.color};">Order ${newStatus}</h3>
          <p style="margin: 0; font-size: 16px;">${statusInfo.message}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="margin-top: 0; color: #2c5aa0;">Order Details</h4>
          <p><strong>Order ID:</strong> ${orderData.orderID}</p>
          <p><strong>Table/Room:</strong> ${orderData.qrID}</p>
          <p><strong>Total Amount:</strong> ₹${orderData.totalAmount.toFixed(2)}</p>
        </div>

        ${
          newStatus !== "Delivered" && newStatus !== "Cancelled"
            ? `
          <p style="text-align: center; color: #6c757d;">
            We'll keep you updated on your order progress.
          </p>
        `
            : ""
        }

        <p>Thank you for your patience and for choosing us!</p>
      </div>

      ${getEmailFooter()}
    </body>
    </html>
  `
}

const restaurantCredentialsTemplate = (restaurantData, credentials) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restaurant Account Created</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      ${getEmailHeader("Restaurant Management System")}
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #2c5aa0; margin-bottom: 20px;">Welcome to Our Platform!</h2>
        
        <p>Dear <strong>${restaurantData.name}</strong> Team,</p>
        <p>Congratulations! Your restaurant has been successfully registered in our digital ordering system.</p>
        
        <div style="background-color: #e3f2fd; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #1976d2;">Your Login Credentials</h3>
          <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 15px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>Restaurant ID:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd; font-family: monospace;">${restaurantData.resID}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>Admin ID:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd; font-family: monospace;">${credentials.adminId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;"><strong>Password:</strong></td>
                <td style="padding: 10px 0; font-family: monospace; background-color: #fff3cd; padding: 5px; border-radius: 3px;">${credentials.password}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #2c5aa0;">Restaurant Information</h3>
          <p><strong>Name:</strong> ${restaurantData.name}</p>
          <p><strong>Location:</strong> ${restaurantData.location}</p>
          <p><strong>Business Type:</strong> ${restaurantData.businessType}</p>
          ${restaurantData.gstNumber ? `<p><strong>GST Number:</strong> ${restaurantData.gstNumber}</p>` : ""}
        </div>

        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
          <h4 style="margin-top: 0; color: #856404;">🔒 Security Notice</h4>
          <p style="margin-bottom: 0;">Please change your password after your first login for enhanced security.</p>
        </div>

        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="margin-top: 0; color: #155724;">🚀 What's Next?</h4>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li>Log in to your admin dashboard</li>
            <li>Set up your menu items</li>
            <li>Create QR codes for tables/rooms</li>
            <li>Start receiving orders!</li>
          </ul>
        </div>

        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Welcome aboard!</p>
      </div>

      ${getEmailFooter()}
    </body>
    </html>
  `
}

module.exports = {
  orderConfirmationTemplate,
  statusUpdateTemplate,
  restaurantCredentialsTemplate,
}
