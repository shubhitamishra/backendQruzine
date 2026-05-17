import { 
  Inter, 
  Playfair_Display, 
  Poppins,
  Montserrat,
  Dancing_Script,
  JetBrains_Mono 
} from "next/font/google";
import "./globals.css";

// Primary font for body text - excellent readability
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Elegant serif for headings and restaurant name
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Modern sans-serif alternative
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Versatile font for UI elements
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Script font for special occasions/signatures
const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  display: "swap",
});

// Monospace for order numbers, prices, etc.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Qruzine",
  description: "Digital Ordering System - Fresh, Fast, Delicious",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable} 
          ${playfairDisplay.variable} 
          ${poppins.variable}
          ${montserrat.variable}
          ${dancingScript.variable}
          ${jetbrainsMono.variable}
          font-sans antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}