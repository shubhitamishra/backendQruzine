  "use client"

 import { useState } from "react"
 import { motion, AnimatePresence } from "framer-motion"
 import { CreditCard, User, Phone, CheckCircle, X, Mail, Calendar, Gift } from "lucide-react"
 import api from '../../../../../../lib/api'

export default function Checkout({ 
  isOpen, 
  onClose, 
  items, 
  total, 
  onComplete,
  formData,
  setFormData,
  resID,
  qrID,
}) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!resID || !qrID) return
    try {
      setSubmitting(true)
      // Map cart items to backend payload
      const payloadItems = items.map(it => {
        // Extract menuID and variantName from id like "menuID:Variant" if present
        const [menuID, variantName] = String(it.id || it.menuID).split(':')
        return {
          menuID,
          quantity: it.quantity,
          variantName: variantName || undefined,
          specialInstructions: it.specialInstructions || '',
        }
      })

      const payload = {
        resID,
        qrID,
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || "guest@example.com",
          age: formData.age || undefined,
          dob: formData.dob || undefined,
        },
        items: payloadItems,
        specialRequest: formData.specialInstructions || '',
      }

      const resp = await api.placeOrder(payload)
      const data = resp?.data?.data || resp?.data || resp
      if (!data || !data.orderID) {
        throw new Error('Failed to place order')
      }

      const confirmation = {
        orderId: data.orderID,
        customerInfo: {
          name: payload.customer.name,
          phone: payload.customer.phone,
          email: payload.customer.email,
          age: formData.age || undefined,
          dob: formData.dob || undefined,
          specialInstructions: formData.specialInstructions || '',
        },
        items,
        total,
        timestamp: data.createdAt || new Date().toISOString(),
        status: data.status || 'Pending',
        estimatedTime: typeof data.estimatedTime === 'number' ? `${data.estimatedTime} mins` : (data.estimatedTime || '—'),
      }

      onComplete(confirmation)
    } catch (err) {
      alert(err?.message || 'Order failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = formData.name && formData.phone

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.button
            aria-label="Close checkout"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl md:w-full max-h-[92vh] md:max-h-[90vh] overflow-hidden border-2 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #220813 0%, #15060c 100%)', borderColor: '#800020' }}
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
          >
            {/* Full-screen ordering overlay while submitting */}
            {submitting && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/80" />
                <div className="relative z-[61] w-full max-w-sm mx-auto rounded-2xl border-2 p-6 text-center" style={{ backgroundColor: 'rgb(15, 18, 15)', borderColor: '#800020' }}>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#d4af37', borderTopColor: 'transparent' }} />
                  <h3 className="text-lg font-semibold mb-1" style={{ color: '#ffffff' }}>Placing your order...</h3>
                  <p className="text-sm" style={{ color: '#cfcfcf' }}>Please wait a moment while we confirm your order.</p>
                </div>
              </div>
            )}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(92vh-64px)] md:max-h-[calc(90vh-80px)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 md:mb-2">
                <h2 className="text-lg md:text-xl font-bold flex items-center" style={{ color: '#ffffff' }}>
                  <CreditCard className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                  Checkout
                </h2>
                <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="rounded-md hover:bg-white/10 p-2 md:p-1" style={{ color: '#ffffff' }}>
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </motion.button>
              </div>
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold" style={{ color: '#ffffff' }}>Customer Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                        <User className="h-4 w-4 inline mr-2" />
                        Full Name *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 md:py-3.5 rounded-lg border-2 bg-black/60 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#800020]"
                        style={{ borderColor: '#800020' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                        <Phone className="h-4 w-4 inline mr-2" />
                        Phone Number *
                      </label>
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 md:py-3.5 rounded-lg border-2 bg-black/60 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#800020]"
                        style={{ borderColor: '#800020' }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 md:py-3.5 rounded-lg border-2 bg-black/60 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#800020]"
                        style={{ borderColor: '#800020' }}
                      />
                    </div>
                  </div>

                  {/* Optional Birthday Offers Section */}
                  <div
                    className="mt-2 p-3 md:p-4 rounded-xl border-2"
                    style={{ borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.08)', boxShadow: '0 0 0 1px rgba(212,175,55,0.12) inset' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-5 w-5" style={{ color: '#d4af37' }} />
                      <h4 className="text-xs md:text-sm font-semibold" style={{ color: '#d4af37' }}>
                        Need exciting offer coupons on birthdays? Enter these as well (optional)
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: '#d4af37' }}>
                          Age (Optional)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={formData.age || ''}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value ? Number(e.target.value) : '' })}
                          className="w-full px-4 py-3 md:py-3.5 rounded-lg border-2 bg-black/60 text-white placeholder-gray-300 focus:outline-none focus:ring-2"
                          style={{ borderColor: '#d4af37', boxShadow: '0 0 0 2px rgba(212,175,55,0.15) inset' }}
                          placeholder="Your age"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: '#d4af37' }}>
                          <Calendar className="h-4 w-4 inline mr-2" />
                          Date of Birth (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.dob || ''}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full px-4 py-3 md:py-3.5 rounded-lg border-2 bg-black/60 text-white placeholder-gray-300 focus:outline-none focus:ring-2"
                          style={{ borderColor: '#d4af37', boxShadow: '0 0 0 2px rgba(212,175,55,0.15) inset' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 md:py-3.5 rounded-lg border-2 bg-black/60 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#800020]"
                      style={{ borderColor: '#800020' }}
                      placeholder="Any special requests or dietary requirements..."
                    />
                  </div>
                </div>

                <hr style={{ borderColor: '#3b0f1a' }} />

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold" style={{ color: '#ffffff' }}>Order Summary</h3>
                  <div className="max-h-40 md:max-h-48 overflow-y-auto space-y-2 pr-1">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs md:text-sm">
                        <span style={{ color: '#ffffff' }}>{item.quantity}x {item.name}</span>
                        <span style={{ color: '#fdfdfd' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <hr style={{ borderColor: '#3b0f1a' }} />
                  <div className="flex justify-between text-lg font-bold">
                    <span style={{ color: '#ffffff' }}>Total</span>
                    <span style={{ color: '#ffffff' }}>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Spacer for sticky bar */}
                <div className="h-4"></div>
              </form>
            </div>

            {/* Sticky action bar */}
            <div className="sticky bottom-0 inset-x-0 p-3 md:p-4 bg-gradient-to-t from-[#15060c] via-[#15060c]/95 to-transparent border-t border-[#3b0f1a]">
              <div className="mx-2 md:mx-0 flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 md:px-6 rounded-lg border-2 font-medium transition-colors hover:bg-[#800020]/10"
                  style={{ borderColor: '#800020', color: '#ffffff', backgroundColor: 'transparent' }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  form="checkout-form"
                  disabled={!isFormValid || submitting}
                  className="flex-1 py-3 px-4 md:px-6 rounded-lg border-2 font-medium transition-colors disabled:opacity-60 hover:bg-[#800020]/10"
                  style={{ borderColor: '#800020', color: '#ffffff', backgroundColor: 'transparent' }}
                  formNoValidate={false}
                >
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  {submitting ? 'Placing...' : 'Place Order'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}