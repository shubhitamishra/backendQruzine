"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { CheckCircle, Clock, User, Phone } from "lucide-react"

// Load Confetti on client only
const Confetti = dynamic(() => import("react-confetti"), { ssr: false })

export default function OrderConfirmation({ isOpen, onClose, orderData }) {
  if (!orderData || !isOpen) return null

  // Window size for confetti
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const [confettiOn, setConfettiOn] = useState(false)

  useEffect(() => {
    const update = () => setDims({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Trigger a short confetti burst when the modal opens
  useEffect(() => {
    if (isOpen && orderData) {
      setConfettiOn(true)
      const t = setTimeout(() => setConfettiOn(false), 4500)
      return () => clearTimeout(t)
    }
  }, [isOpen, orderData])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative rounded-xl max-w-md w-full border-2 p-6" style={{ backgroundColor: 'rgb(15, 18, 15)', borderColor: 'rgb(212, 175, 55)' }}>
        {confettiOn && (
          <div className="pointer-events-none absolute inset-0 -z-0">
            <Confetti width={dims.width} height={dims.height} numberOfPieces={240} recycle={false} gravity={0.3} initialVelocityY={12} tweenDuration={4000} />
          </div>
        )}
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'rgb(212, 175, 55)' }}>Order Confirmed!</h2>
              <p className="text-gray-400 text-sm mt-1" style={{ opacity: 0.7 }}>Thank you for your order</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-2xl font-bold" style={{ color: 'rgb(212, 175, 55)' }}>#{orderData.orderId}</div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500 text-white">
              Accepted
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 p-3 border rounded-lg" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <Clock className="h-5 w-5 text-orange-300" />
            <span className="text-gray-300">Estimated time: </span>
            <span className="font-semibold" style={{ color: 'rgb(212, 175, 55)' }}>{orderData.estimatedTime}</span>
          </div>

          <div className="text-left space-y-3">
            <h3 className="font-semibold" style={{ color: 'rgb(212, 175, 55)' }}>Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" style={{ color: 'rgb(212, 175, 55)' }} />
                <span className="text-gray-300">{orderData.customerInfo.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" style={{ color: 'rgb(212, 175, 55)' }} />
                <span className="text-gray-300">{orderData.customerInfo.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-left" style={{ color: 'rgb(212, 175, 55)' }}>Items Ordered</h3>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.quantity}x {item.name}</span>
                  <span style={{ color: 'rgb(212, 175, 55)' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <hr style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} />
            <div className="flex justify-between font-bold">
              <span style={{ color: 'rgb(212, 175, 55)' }}>Total</span>
              <span style={{ color: 'rgb(212, 175, 55)' }}>₹{orderData.total.toFixed(2)}</span>
            </div>
          </div>

          {orderData.customerInfo.specialInstructions && (
            <div className="space-y-2">
              <h3 className="font-semibold text-left" style={{ color: 'rgb(212, 175, 55)' }}>Special Instructions</h3>
              <p className="text-sm text-gray-300 p-2 border rounded text-left" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', backgroundColor: 'rgba(212, 175, 55, 0.05)' }}>
                {orderData.customerInfo.specialInstructions}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs text-gray-400" style={{ opacity: 0.7 }}>
              We'll send your confirmation and updates to {orderData.customerInfo.email || 'your email'} and {orderData.customerInfo.phone}.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-lg font-bold transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'rgb(212, 175, 55)', color: 'rgb(15, 18, 15)' }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}