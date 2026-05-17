const fs = require("fs")
const path = require("path")

// Generate invoice HTML
const generateInvoiceHTML = (orderData) => {
  const { orderID, customer, items, totalAmount, restaurant, qrCodeInfo, createdAt, status, paymentStatus } = orderData

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${orderID}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .invoice-details div {
            flex: 1;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .total-section {
            text-align: right;
            margin-bottom: 30px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #2c5aa0;
        }
        .footer {
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            color: #666;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-delivered { background-color: #d4edda; color: #155724; }
        .status-processing { background-color: #fff3cd; color: #856404; }
        .status-pending { background-color: #f8d7da; color: #721c24; }
        .payment-paid { background-color: #d1ecf1; color: #0c5460; }
        .payment-pending { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
        <h2>${restaurant?.name || "Restaurant"}</h2>
        <p>${restaurant?.location || ""}</p>
    </div>

    <div class="invoice-details">
        <div>
            <h3>Bill To:</h3>
            <p><strong>${customer.name}</strong></p>
            <p>${customer.email}</p>
            <p>${customer.phone}</p>
            <p>Table/Room: ${qrCodeInfo?.type || qrCodeInfo?.qrID || "N/A"}</p>
        </div>
        <div>
            <h3>Invoice Details:</h3>
            <p><strong>Order ID:</strong> ${orderID}</p>
            <p><strong>Date:</strong> ${new Date(createdAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(createdAt).toLocaleTimeString()}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${status.toLowerCase()}">${status}</span></p>
            <p><strong>Payment:</strong> <span class="status-badge payment-${paymentStatus.toLowerCase()}">${paymentStatus}</span></p>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${items
              .map(
                (item) => `
                <tr>
                    <td>
                        <strong>${item.name}</strong>
                        ${item.specialInstructions ? `<br><small>Note: ${item.specialInstructions}</small>` : ""}
                    </td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>

    <div class="total-section">
        <p class="total-amount">Total Amount: ₹${totalAmount.toFixed(2)}</p>
    </div>

    <div class="footer">
        <p>Thank you for your order!</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
  `

  return invoiceHTML
}

// Generate invoice PDF (requires puppeteer - optional)
const generateInvoicePDF = async (orderData) => {
  try {
    // This would require puppeteer to be installed
    // const puppeteer = require('puppeteer');
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(generateInvoiceHTML(orderData));
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // return pdf;

    // For now, return HTML content
    return generateInvoiceHTML(orderData)
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error("Failed to generate PDF invoice")
  }
}

module.exports = {
  generateInvoiceHTML,
  generateInvoicePDF,
}
