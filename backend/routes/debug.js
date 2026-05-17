const express = require('express')
const router = express.Router()
const { sendWhatsAppRaw, normalizePhone } = require('../utils/whatsappService')

// DEBUG: send a test WhatsApp message
// curl -X POST http://localhost:5000/api/debug/whatsapp -H "Content-Type: application/json" -d '{"phone":"+919999999999","message":"Test from debug"}'
router.post('/whatsapp', async (req, res) => {
  try {
    const { phone, message } = req.body || {}
    const normalized = normalizePhone(phone)
    const result = await sendWhatsAppRaw(phone, message || 'Test message from /api/debug/whatsapp')
    res.json({ success: true, normalized, result })
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || String(err) })
  }
})

module.exports = router
