"use client"

import { useState } from "react"
import { Search, Clock, CheckCircle, Truck, ChefHat, X } from "lucide-react"
import api from '../../../../../../lib/api'

const statusMeta = {
  Pending: { label: "Pending", icon: Clock, color: "bg-yellow-500" },
  Accepted: { label: "Accepted", icon: CheckCircle, color: "bg-green-500" },
  Processing: { label: "Processing", icon: Clock, color: "bg-orange-500" },
  Cooked: { label: "Cooked", icon: ChefHat, color: "bg-blue-500" },
  Delivered: { label: "Delivered", icon: Truck, color: "bg-green-600" },
  Cancelled: { label: "Cancelled", icon: X, color: "bg-red-500" },
}

export default function OrderTracker({ isOpen, onClose }) {
  const [orderId, setOrderId] = useState("")
  const [searchedOrder, setSearchedOrder] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    if (!orderId) return
    setIsSearching(true)
    setError(null)
    try {
      const resp = await api.getOrderStatus(orderId)
      const data = resp?.data?.data || resp?.data || resp
      if (!data) throw new Error('Order not found')
      // Optionally fetch detailed items
      let items = []
      try {
        const det = await api.getOrderDetails(orderId)
        const detData = det?.data?.data || det?.data || det
        if (detData?.items) {
          items = detData.items.map(it => it.name + (it.variantName ? ` - ${it.variantName}` : ''))
        }
      } catch {}

      setSearchedOrder({
        id: data.orderID,
        status: data.status,
        estimatedTime: typeof data.estimatedTime === 'number' ? `${data.estimatedTime} mins` : (data.estimatedTime || '—'),
        customerName: data.customerName,
        restaurant: data.restaurant,
        statusHistory: data.statusHistory || [],
        total: data.totalAmount,
        items,
      })
    } catch (e) {
      setSearchedOrder(null)
      setError(e?.message || 'Failed to fetch order')
    } finally {
      setIsSearching(false)
    }
  }

  const renderStatusTimeline = (currentStatus) => {
    const statuses = ["Pending", "Accepted", "Processing", "Cooked", "Delivered"]
    const currentIndex = statuses.indexOf(currentStatus)

    return (
      <div className="flex items-center justify-between mt-6">
        {statuses.map((status, index) => {
          const StatusIcon = (statusMeta[status] || statusMeta.Pending).icon
          const isActive = index <= currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={status} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive ? (statusMeta[status]?.color || 'bg-gray-300') : "bg-gray-300"
                } ${isCurrent ? "ring-4 ring-yellow-300" : ""}`}
              >
                <StatusIcon className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xs mt-2 ${isActive ? "text-yellow-400" : "text-gray-500"}`}>
                {(statusMeta[status]?.label) || status}
              </span>
              {index < statuses.length - 1 && (
                <div className={`h-1 w-full mt-2 ${index < currentIndex ? "bg-yellow-400" : "bg-gray-300"}`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative rounded-xl max-w-md w-full border-2 p-6" style={{ backgroundColor: 'rgb(15, 18, 15)', borderColor: 'rgb(212, 175, 55)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'rgb(212, 175, 55)' }}>Track Your Order</h2>
          <button onClick={onClose} style={{ color: 'rgb(212, 175, 55)' }}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              placeholder="Enter Order ID (e.g., ORD001)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border-2 text-white placeholder:text-gray-400"
              style={{ backgroundColor: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.2)' }}
            />
            <button
              onClick={handleSearch}
              disabled={!orderId || isSearching}
              className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'rgb(212, 175, 55)', color: 'rgb(15, 18, 15)' }}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          {isSearching && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'rgb(212, 175, 55)' }}></div>
              <p className="text-gray-300 mt-2">Searching for your order...</p>
            </div>
          )}

          {searchedOrder && (
            <div className="border rounded-lg p-4 space-y-4" style={{ borderColor: 'rgb(212, 175, 55)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold" style={{ color: 'rgb(212, 175, 55)' }}>Order {searchedOrder.id}</h3>
                  <p className="text-sm text-gray-300">Estimated time: {searchedOrder.estimatedTime}</p>
                </div>
                <div className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgb(212, 175, 55)', color: 'rgb(15, 18, 15)' }}>
                  {(statusMeta[searchedOrder.status]?.label) || searchedOrder.status}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: 'rgb(212, 175, 55)' }}>Items:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {searchedOrder.items.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="text-right">
                <span className="text-lg font-semibold" style={{ color: 'rgb(212, 175, 55)' }}>₹{Number(searchedOrder.total || 0).toFixed(2)}</span>
              </div>

              {renderStatusTimeline(searchedOrder.status)}
            </div>
          )}
          {orderId && !searchedOrder && !isSearching && (
            <div className="text-center py-4">
              <p className="text-gray-400">Order not found. Please check your Order ID.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}