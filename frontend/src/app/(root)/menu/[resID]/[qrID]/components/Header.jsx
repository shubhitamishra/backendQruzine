"use client"

import Image from "next/image"
import { ShoppingCart } from "lucide-react"

// Header with optional logo image on the left + restaurant name, and only cart icon on the right.
// Mobile-friendly and professional with gold accents.
export default function Header({ cartItemsCount = 0, onCartClick, restaurantName = "Restaurant", logoUrl }) {
  const initial = (restaurantName || 'R').trim().charAt(0).toUpperCase()
  const effectiveLogoUrl = logoUrl || "/images/logo.png"
  return (
    <header
      className="sticky top-0 z-40 border-b-2"
      style={{
        backgroundColor: 'rgba(15, 18, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgb(212, 175, 55)'
      }}
    >
      <div className="w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Name */}
          <div className="flex items-center gap-3 min-w-0">
            {effectiveLogoUrl ? (
              <div 
                className="h-10 w-10 relative ring-1 rounded-md"
                style={{ ringColor: 'rgba(212, 175, 55, 0.4)' }}
              >
                <Image
                  src={effectiveLogoUrl}
                  alt={`${restaurantName} logo`}
                  fill
                  className="rounded-md object-cover"
                  sizes="40px"
                  priority
                />
              </div>
            ) : (
              <div
                className="h-10 w-10 rounded-md flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: 'rgb(212, 175, 55)', color: 'rgb(15, 18, 15)' }}
                aria-hidden
              >
                {initial}
              </div>
            )}
            <h1
              className="text-base sm:text-lg md:text-xl font-semibold leading-none truncate"
              style={{ color: '#FFFAFA' }}
              title={restaurantName}
            >
              {restaurantName}
            </h1>
          </div>

          {/* Right: Cart */}
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-md transition-colors focus:outline-none focus:ring-2"
            style={{ color: '#FFFAFA', outlineColor: 'rgba(212, 175, 55, 0.6)' }}
            aria-label="Open cart"
          >
            <ShoppingCart className="h-6 w-6" aria-hidden />
            {cartItemsCount > 0 && (
              <span
                className="absolute -top-2 -right-2 text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-semibold"
                style={{ backgroundColor: 'rgb(212, 175, 55)', color: 'rgb(15, 18, 15)' }}
                aria-label={`${cartItemsCount} items in cart`}
              >
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}