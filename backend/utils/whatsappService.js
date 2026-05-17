const isConfigured = () => {
  return (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  )
}

let twilioClient = null
if (isConfigured()) {
  try {
    const twilio = require('twilio')
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  } catch (e) {
    console.error('Failed to initialize Twilio client:', e)
  }
}

const normalizePhone = (phone) => {
  if (!phone) return null
  // Remove spaces, dashes, parentheses, zero-width chars
  const cleaned = String(phone)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\s\-()]/g, '')
  if (!cleaned) return null
  if (cleaned.startsWith('+')) {
    // Ensure all remaining are digits
    const digits = cleaned.slice(1)
    if (/^\d+$/.test(digits)) return `+${digits}`
    return null
  }
  const defaultCountry = process.env.DEFAULT_COUNTRY_CODE || '' // e.g., +91
  if (!defaultCountry || !/^\+\d+$/.test(defaultCountry)) return null
  if (!/^\d+$/.test(cleaned)) return null
  return `${defaultCountry}${cleaned}`
}

async function sendWhatsApp(toNumber, body) {
  if (!twilioClient) {
    console.warn('[WhatsApp] Skipping send: Twilio not configured')
    return { skipped: true }
  }
  const to = normalizePhone(toNumber)
  if (!to) {
    console.warn('[WhatsApp] Skipping send: invalid or missing phone number')
    return { skipped: true }
  }
  try {
    const message = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
      body,
    })
    return { sid: message.sid }
  } catch (err) {
    console.error('[WhatsApp] Failed to send message:', err?.message || err)
    return { error: err?.message || String(err) }
  }
}

function formatItemsList(items = []) {
  return items
    .map((it) => `${it.quantity} x ${it.name}${it.variantName ? ` (${it.variantName})` : ''} - ₹${(it.price * it.quantity).toFixed(2)}`)
    .join('\n')
}

async function sendOrderConfirmationWhatsApp({ orderID, customer, qrID, qrName, items, totalAmount, estimatedTime, specialRequest, orgName, restaurantName }) {
  const title = '✅ Order Confirmed'
  const qrLabel = qrName || null
  const org = orgName || process.env.ORG_NAME || 'qruzine'
  const rest = restaurantName ? `Restaurant: ${restaurantName}` : ''
  const body = [
    `${title}`,
    `Order: #${orderID}`,
    rest,
    qrLabel ? `Location: ${qrLabel}` : '',
    `Estimated Time: ${estimatedTime} min`,
    '',
    'Items:',
    formatItemsList(items),
    '',
    `Total: ₹${Number(totalAmount).toFixed(2)}`,
    specialRequest ? `Note: ${specialRequest}` : '',
    '',
    `Thank you for ordering with ${org}!`
  ].filter(Boolean).join('\n')
  return sendWhatsApp(customer?.phone, body)
}

async function sendOrderStatusWhatsApp(order, status, opts = {}) {
  const qrLabel = order.qrName || null
  const org = opts.orgName || process.env.ORG_NAME || 'qruzine'
  const rest = opts.restaurantName ? `Restaurant: ${opts.restaurantName}` : ''
  const body = [
    `ℹ️ Order Update` ,
    `Order: #${order.orderID}`,
    rest,
    `Status: ${status}`,
    order.estimatedTime ? `ETA: ${order.estimatedTime} min` : '',
    `Location: ${qrLabel}`,
    '',
    `Powered by ${org}`
  ].filter(Boolean).join('\n')
  return sendWhatsApp(order?.customer?.phone, body)
}

module.exports = {
  sendOrderConfirmationWhatsApp,
  sendOrderStatusWhatsApp,
  isConfigured,
  // Expose raw sender and normalizer for debug tools
  sendWhatsAppRaw: sendWhatsApp,
  normalizePhone,
}
