"use client"

import Image from "next/image"
import { Plus, Minus, Trash2, ShoppingBag, X } from "lucide-react"
import BannerMedia from "../../../../../../components/BannerMedia"

// Mobile Cart Row
function MobileCartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div 
      className="flex items-center gap-2 py-2 px-2 rounded-md mb-2"
      style={{ backgroundColor: '#510400', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', border: '1px solid #800020' }}
    >
      {/* Image (20% width) */}
      <div className="w-14 h-14 flex-shrink-0 relative">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover rounded-md"
          sizes="56px"
        />
      </div>

      {/* Name + Price */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-white leading-tight">{item.name}</h3>
        <p className="text-xs font-bold" style={{ color: '#FFFAFA' }}>
          ₹{item.price.toFixed(2)}
        </p>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
          className="p-1 rounded bg-[#800020] text-white"
          aria-label={`Decrease ${item.name} quantity`}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm text-white w-5 text-center">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="p-1 rounded bg-[#800020] text-white"
          aria-label={`Increase ${item.name} quantity`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function DesktopCartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div 
        className="flex items-start space-x-4 p-4 rounded-xl border transition-all hidden sm:flex mb-2"
      style={{ backgroundColor: '#510400', borderColor: '#800020' }}  >
      <div className="relative">
        <div className="w-10 h-10 relative">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover rounded-lg"
            sizes="40px"
          />
        </div>
        <div 
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" 
          style={{ backgroundColor: '#ffffff', color: '#800020' }}
        >
          {item.quantity}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-sm mb-1" style={{ color: '#FFFAFA' }}>{item.name}</h4>
            <p className="text-sm text-gray-300 mb-2">{item.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: '#FFFAFA' }}>₹{item.price.toFixed(2)}</span>
              <span className="text-sm text-gray-400">each</span>
            </div>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-3 bg-black/30 rounded-lg p-1">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
              className="w-8 h-8 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors"
              aria-label={`Decrease ${item.name} quantity`}
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="w-8 text-center font-bold text-lg" style={{ color: '#E7B2A4' }}>
              {item.quantity}
            </span>

            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 rounded-md hover:bg-green-500/20 text-green-400 hover:text-green-300 flex items-center justify-center transition-colors"
              aria-label={`Increase ${item.name} quantity`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: '#E7B2A4' }}>
            ₹{(item.price * item.quantity).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">total</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Cart({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  subtotal,
  tax, 
  total 
}) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-lg border-l-2" 
            style={{ backgroundColor: 'rgb(15, 18, 15)', borderColor: '#800020' }}>
            
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="border-b p-4 sm:p-6" style={{ borderColor: 'rgba(128, 0, 32, 0.4)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ color: '#FFFAFA' }}>
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    <h2 className="text-sm font-bold">Your Order</h2>
                    <span className="ml-1 px-1 py-1 rounded-full text-xs font-sm" 
                      style={{ backgroundColor: '#ffffff', color: '#800020' }}>
                      {totalItems} items
                    </span>
                  </div>
                  <button onClick={onClose} className="p-2" style={{ color: '#FFFAFA' }}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Banner */}
              <div className="p-3 sm:p-4">
                <BannerMedia placement="cart" />
              </div>

              {/* Body */}
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2" style={{ color: '#FFFAFA' }} />
                    <h3 className="text-sm font-semibold mb-2" style={{ color: '#a4a2a2ff' }}>Your cart is empty</h3>
                    <p className="text-[#a4a2a2ff]">Add some delicious items to get started!</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden">
                      {items.map(item => (
                        <MobileCartItem 
                          key={item.id} 
                          item={item} 
                          onUpdateQuantity={onUpdateQuantity}
                          onRemove={onRemoveItem}
                        />
                      ))}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      {items.map(item => (
                        <DesktopCartItem 
                          key={item.id} 
                          item={item} 
                          onUpdateQuantity={onUpdateQuantity}
                          onRemove={onRemoveItem}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t p-3 sm:p-4 space-y-2 sm:space-y-3" 
                    style={{ borderColor: '#800020', backgroundColor: 'rgba(7, 6, 2, 0.08)' }}>
                    
                    <div className="space-y-2 sm:space-y-2 text-sm sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Subtotal</span>
                        <span style={{ color: '#ffffffff' }}>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Tax (10%)</span>
                        <span style={{ color: '#ffffffff' }}>₹{tax.toFixed(2)}</span>
                      </div>
                      <hr style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} />
                      <div className="flex justify-between text-xl sm:text-xl font-bold">
                        <span style={{ color: '#ffffffff' }}>Total</span>
                        <span style={{ color: '#ffffffff' }}>₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={onCheckout}
                      className="w-full py-2 sm:py-4 px-3 rounded-sm font-bold text-sm sm:text-sm transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: '#800020', color: '#ffffff' }}
                    >
                      Proceed to Checkout → ₹{total.toFixed(2)}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}