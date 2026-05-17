"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, X, ShoppingCart, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import BannerMedia from "../../../../../../components/BannerMedia"

// Safely compute the lowest available variant price
function getLowestAvailablePrice(item) {
  if (!item?.variants || !Array.isArray(item.variants) || item.variants.length === 0) {
    return typeof item?.price === 'number' ? item.price : 0
  }
  const available = item.variants.filter(v => v && v.isAvailable !== false && typeof v.price === 'number')
  if (available.length === 0) {
    return typeof item?.price === 'number' ? item.price : 0
  }
  return Math.min(...available.map(v => v.price))
}

// Compute total qty across all variants of a parent item
function getVariantTotalQty(cart, item) {
  if (!cart || !item?.menuID) return 0
  const prefix = `${item.menuID}:`
  return Object.entries(cart).reduce((sum, [key, val]) => (key.startsWith(prefix) ? sum + (val || 0) : sum), 0)
}

// Bottom sheet for selecting variants (mobile) with animations
function VariantBottomSheet({ open, onClose, item, cart, onQuantityChange }) {
  const variants = (item?.variants || []).filter(v => v && v.isAvailable !== false)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.9 }}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
              className="relative w-full bg-[#800020] border-t border-black/60 rounded-t-3xl p-4 pt-2 shadow-[0_-12px_50px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/40" />

              <div className="flex items-start gap-3">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-black/50" />
                <div className="flex-1">
                  <h3 className="text-[#FFFAFA] font-semibold text-base leading-tight">{item.name}</h3>
                  <p className="text-xs text-[#FFFAFA]/80 line-clamp-2">{item.description}</p>
                </div>
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-black text-[#FFFAFA] shrink-0 hover:bg-black/90 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3">
                <p className="text-xs text-[#FFFAFA]/80 mb-2">Choose an option</p>
                <div className="max-h-[52vh] overflow-y-auto pr-1 space-y-2">
                  {variants.map(v => {
                    const composed = {
                      ...item,
                      id: `${item.menuID}:${v.name}`,
                      name: `${item.name} - ${v.name}`,
                      price: v.price,
                    }
                    const qty = cart?.[composed.id] || 0
                    return (
                      <div key={composed.id} className="flex items-center justify-between bg-[#5a001a] border border-black/50 rounded-xl p-2.5">
                        <div>
                          <p className="text-sm text-[#FFFAFA] font-medium leading-tight">{v.name}</p>
                          <p className="text-xs text-[#FFFAFA]">₹{(v.price || 0).toFixed(2)}</p>
                        </div>
                        {qty > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); onQuantityChange(composed, Math.max(0, qty - 1)) }}
                              className="px-3 py-2 rounded-lg bg-black text-[#FFFAFA] active:scale-95 transition"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="text-[#FFFAFA] text-sm w-7 text-center">{qty}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); onQuantityChange(composed, qty + 1) }}
                              className="px-3 py-2 rounded-lg bg-black text-[#FFFAFA] active:scale-95 transition"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onQuantityChange(composed, 1) }}
                            className="px-4 py-2 rounded-lg bg-black text-[#FFFAFA] text-sm active:scale-95 transition"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Render a variant row controller
function VariantControls({ parent, variant, quantity, onChange }) {
  const composed = {
    ...parent,
    id: `${parent.menuID}:${variant.name}`,
    name: `${parent.name} - ${variant.name}`,
    price: variant.price,
  }
  return (
    <div className="flex items-center justify-between mt-2">
      <span className="text-xs text-gray-200">{variant.name} · ₹{variant.price.toFixed(2)}</span>
      {quantity > 0 ? (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onChange(composed, Math.max(0, quantity - 1)) }} className="p-2 rounded bg-black text-[#FFFAFA]">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm text-[#FFFAFA] w-6 text-center">{quantity}</span>
          <button onClick={(e) => { e.stopPropagation(); onChange(composed, quantity + 1) }} className="p-2 rounded bg-black text-[#FFFAFA]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onChange(composed, 1) }} className="px-3 py-2 rounded bg-black text-[#FFFAFA] text-xs">Add</button>
      )}
    </div>
  )
}

function MobileMenuItem({ item, quantity, onQuantityChange, cart }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const lowestPrice = getLowestAvailablePrice(item)
  const variantTotalQty = getVariantTotalQty(cart, item)

  return (
    <div className="py-0.5 block md:hidden cursor-pointer">
      <div 
        onClick={() => {
          if (Array.isArray(item.variants) && item.variants.length > 0) {
            setIsSheetOpen(true)
          } else {
            setIsExpanded(!isExpanded)
          }
        }} 
        className="relative flex items-center gap-2 bg-[#510400] rounded-lg p-2 border border-black/60"
      >
        {item.isSpecialItem && (
          <span className="absolute top-1 right-1 bg-[#800020] text-white text-[10px] px-2 py-0.5 rounded">Special</span>
        )}
        <img 
          src={item.image} 
          alt={item.name} 
          loading="lazy"
          decoding="async"
          className="w-1/5 h-16 object-cover rounded-md flex-shrink-0" 
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white leading-tight">{item.name}</h3>
          {(!item.variants?.length) ? (
            <p className="text-xs text-[#FFFAFA] font-bold">₹{(item.price || 0).toFixed(2)}</p>
          ) : (
            <p className="text-xs text-[#FFFAFA] font-bold">From ₹{(lowestPrice || 0).toFixed(2)}</p>
          )}
        </div>
        {!item.variants?.length ? (
          quantity > 0 ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onQuantityChange(item, Math.max(0, quantity - 1)) }} 
                className="p-2 rounded bg-black text-[#FFFAFA]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#FFFAFA] w-6 text-center">{quantity}</span>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onQuantityChange(item, quantity + 1); setBurstKey(k => k + 1) }} 
                className="p-2 rounded bg-black text-[#FFFAFA]"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onQuantityChange(item, 1); setBurstKey(k => k + 1) }} 
              className="p-2 rounded-full bg-black text-[#FFFAFA] flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          )
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={(e) => { e.stopPropagation(); setIsSheetOpen(true) }}
            className="px-3 py-2 rounded-full bg-black text-[#FFFAFA] text-xs shadow hover:shadow-md active:scale-95 transition"
          >
            Add
            {variantTotalQty > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-4 px-1 h-4 text-[10px] bg-[#FFFAFA] text-black rounded-full">{variantTotalQty}</span>
            )}
          </motion.button>
        )}

        {/* +1 burst animation */}
        <AnimatePresence>
          {burstKey > 0 && (
            <motion.span
              key={burstKey}
              initial={{ opacity: 0, y: 0, scale: 0.9 }}
              animate={{ opacity: 1, y: -22, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-[#FFFAFA] text-xs px-2 py-0.5 rounded-full shadow"
              onAnimationComplete={() => setBurstKey(0)}
            >
              +1
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {isExpanded && (
        <div className="mt-1 ml-1">
          <p className="text-xs text-gray-200">{item.description}</p>
          {Array.isArray(item.variants) && item.variants.length > 0 && (
            <div className="mt-2 space-y-1">
              {item.variants.filter(v => v.isAvailable !== false).map(v => (
                <VariantControls
                  key={`${item.menuID}-${v.name}`}
                  parent={item}
                  variant={v}
                  quantity={cart[`${item.menuID}:${v.name}`] || 0}
                  onChange={onQuantityChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom sheet for selecting a variant (mobile) */}
      <VariantBottomSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        item={item}
        cart={cart}
        onQuantityChange={(composed, q) => {
          onQuantityChange(composed, q)
          // Keep the sheet open so users can add multiple; close when first add? Up to UX. We'll keep open.
          if (q > 0) setBurstKey(k => k + 1)
        }}
      />
    </div>
  )
}

function DesktopMenuItem({ item, quantity, onQuantityChange, cart }) {
  const [burstKey, setBurstKey] = useState(0)
  return (
    <div className="py-0.5 hidden md:flex flex-col rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border bg-[#510400] border-black/60 cursor-pointer relative">
      {item.isSpecialItem && (
        <span className="absolute top-2 right-2 bg-black text-[#FFFAFA] text-xs px-2 py-1 rounded">Special</span>
      )}
      <img 
        src={item.image} 
        alt={item.name} 
        loading="lazy"
        decoding="async"
        className="w-full h-48 object-cover" 
      />
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg mb-2 text-[#FFFAFA]">{item.name}</h3>
        <p className="text-gray-200 text-sm mb-4 flex-1">{item.description}</p>
        <div className="flex items-center justify-between">
          {(!item.variants?.length) ? (
            <span className="font-bold text-[#FFFAFA]">₹{(item.price || 0).toFixed(2)}</span>
          ) : (
            <span className="font-bold text-[#FFFAFA]">From ₹{Math.min(...item.variants.filter(v=>v.isAvailable!==false).map(v=>v.price)).toFixed(2)}</span>
          )}
          {!item.variants?.length && (quantity > 0 ? (
            <div className="flex items-center gap-1">
              <button onClick={() => onQuantityChange(item, Math.max(0, quantity - 1))} className="p-2 rounded bg-black text-[#FFFAFA]">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-[#FFFAFA] font-bold">{quantity}</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onQuantityChange(item, quantity + 1); setBurstKey(k => k + 1) }} className="p-2 rounded bg-black text-[#FFFAFA]">
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onQuantityChange(item, 1); setBurstKey(k => k + 1) }} className="p-3 rounded-full bg-black text-[#FFFAFA] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </motion.button>
          ))}
        </div>
        {Array.isArray(item.variants) && item.variants.length > 0 && (
          <div className="mt-3 space-y-2">
            {item.variants.filter(v => v.isAvailable !== false).map(v => (
              <VariantControls
                key={`${item.menuID}-${v.name}`}
                parent={item}
                variant={v}
                quantity={cart[`${item.menuID}:${v.name}`] || 0}
                onChange={onQuantityChange}
              />
            ))}
          </div>
        )}
      </div>
      {/* +1 burst animation */}
      <AnimatePresence>
        {burstKey > 0 && (
          <motion.span
            key={burstKey}
            initial={{ opacity: 0, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: -22, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="absolute right-3 top-3 bg-black text-[#FFFAFA] text-xs px-2 py-0.5 rounded-full shadow"
            onAnimationComplete={() => setBurstKey(0)}
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MenuItems({ activeCategory, onCategoryChange, cart, onQuantityChange, items = [], categories = ["All"], vegOnly = false, onToggleVeg, onGoToCart, dietPreference = 'all', onDietPreferenceChange }) {
  const router = useRouter()
  const filteredItems = activeCategory === "All" 
    ? items 
    : items.filter(item => item.category === activeCategory)

  // Toast state for add-to-cart feedback
  const [toastKey, setToastKey] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [dietOpen, setDietOpen] = useState(false)

  // Cart count (sum of quantities) - coerce values to numbers for robustness
  const cartCount = Object.values(cart || {}).reduce((sum, v) => {
    const n = Number(v)
    return sum + (Number.isFinite(n) ? n : 0)
  }, 0)

  const triggerToast = () => {
    setToastKey(k => k + 1)
    setToastVisible(true)
    // Auto-hide quickly to keep it snappy
    setTimeout(() => setToastVisible(false), 900)
  }

  // Wrap quantity change to detect increments
  const handleQuantityChange = (itm, q) => {
    const id = itm?.id ?? itm?.menuID
    const prev = (id && cart?.[id]) ? cart[id] : 0
    onQuantityChange(itm, q)
    if (typeof q === 'number' && q > prev) {
      triggerToast()
    }
  }

  return (
    <div className="px-2 py-4">
      {/* Categories */}
      <div className="flex items-center justify-between pb-2 mb-3">
        <div className="flex gap-2 overflow-x-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none]" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`scroll-mx-4 snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all shadow ${
                activeCategory === cat
                  ? 'text-[#FFFAFA] shadow-lg border-2'
                  : 'text-gray-200 border'
              }`}
              style={
                activeCategory === cat
                  ? { background: 'linear-gradient(135deg, #800020 0%, #000000 100%)', borderColor: 'rgb(212, 175, 55)' }
                  : { backgroundColor: 'rgba(30,30,30,0.6)', borderColor: 'rgba(0,0,0,0.6)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative ml-3">
          <button
            onClick={() => setDietOpen(o => !o)}
            className="px-4 py-2 rounded-full text-sm md:text-base font-semibold border shadow transition-all inline-flex items-center gap-2"
            style={(vegOnly || dietPreference === 'veg')
              ? { background: 'linear-gradient(135deg, #800020 0%, #000000 100%)', color: '#FFFAFA', borderColor: 'rgb(212, 175, 55)' }
              : { backgroundColor: 'rgba(30,30,30,0.6)', color: 'rgb(229, 231, 235)', borderColor: 'rgba(0,0,0,0.6)' }}
            aria-haspopup="menu"
            aria-expanded={dietOpen}
          >
            <span>{dietPreference === 'veg' ? 'Veg only' : dietPreference === 'nonveg' ? 'Non-veg' : dietPreference === 'vegan' ? 'Vegan' : 'All items'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {dietOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden border"
                style={{ backgroundColor: 'rgba(15, 18, 15, 0.98)', borderColor: 'rgb(212, 175, 55)', zIndex: 60 }}
                role="menu"
              >
                {[
                  { key: 'veg', label: 'Veg only' },
                  { key: 'nonveg', label: 'Non-veg' },
                  { key: 'vegan', label: 'Vegan' },
                  { key: 'all', label: 'All items' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { onDietPreferenceChange && onDietPreferenceChange(opt.key); setDietOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-black/40"
                    style={{ color: '#FFFAFA' }}
                    role="menuitem"
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Items */}
      <div className="space-y-1">
        {filteredItems.map((item, index) => (
          <div key={item.id || item.menuID || index}>
            <MobileMenuItem
              item={item}
              quantity={cart[item.id] || cart[item.menuID] || 0}
              onQuantityChange={handleQuantityChange}
              cart={cart}
            />

            {activeCategory === "All" && index === Math.floor(filteredItems.length / 2) && (
              <div className="w-full my-4">
                <BannerMedia placement="menu" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Items */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item, index) => {
          if (
            activeCategory === "All" &&
            index === Math.floor(filteredItems.length / 2)
          ) {
            return (
              <React.Fragment key={`ad-${index}`}>
                <DesktopMenuItem
                  item={item}
                  quantity={cart[item.id] || cart[item.menuID] || 0}
                  onQuantityChange={handleQuantityChange}
                  cart={cart}
                />
              </React.Fragment>
            )
          }

          return (
            <DesktopMenuItem
              key={item.id || item.menuID || index}
              item={item}
              quantity={cart[item.id] || cart[item.menuID] || 0}
              onQuantityChange={handleQuantityChange}
              cart={cart}
            />
          )
        })}
      </div>

      {/* Mobile sticky Go to Cart button (matches header cart style) */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            key={`go-cart-${cartCount}`}
            initial={{ y: 64, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}
            exit={{ y: 64, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (typeof onGoToCart === 'function') { onGoToCart() } else { router.push('/cart') } }}
            className="lg:hidden fixed left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-full text-[#FFFAFA] flex items-center gap-2 backdrop-blur-md"
            style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          >
            <div
              className="absolute inset-0 -z-10 rounded-full border-2"
              style={{
                backgroundColor: 'rgba(15, 18, 15, 0.85)',
                borderColor: 'rgb(212, 175, 55)'
              }}
            />
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-semibold">Go to Cart</span>
            <motion.span
              key={`badge-${cartCount}`}
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 24 }}
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-full text-black text-xs px-2"
              style={{ backgroundColor: 'rgb(212, 175, 55)' }}
            >
              {cartCount}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom-center quick toast for add-to-cart */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            key={toastKey}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black text-[#FFFAFA] text-sm shadow-lg md:bottom-8"
          >
            Added to cart
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
