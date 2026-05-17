const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { verifyEmailConfig } = require("./utils/emailService");
const { isConfigured: isWhatsAppConfigured } = require("./utils/whatsappService");

const app = express();

// ---- Security Middleware ----
app.use(helmet());

// ---- CORS Setup ----
// Support multiple frontend URLs via FRONTEND_URLS (comma-separated) or single FRONTEND_URL
const envFrontendUrls = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s.replace(/\/$/, "")); // remove trailing slash

const singleFrontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

// Allow common localhost ports in development when FRONTEND_URL(S) isn't set
const devFallbackOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

const allowedOrigins = [
  ...envFrontendUrls,
  ...(singleFrontendUrl ? [singleFrontendUrl] : []),
  ...(envFrontendUrls.length === 0 && !singleFrontendUrl ? devFallbackOrigins : []),
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow Postman, curl, etc.

    const isExactAllowed = allowedOrigins.includes(origin);
    // Optional: allow Vercel preview deployments if you add pattern via env
    const vercelPattern = process.env.ALLOW_VERCEL_PATTERN === "true";
    const isVercel = vercelPattern && /\.vercel\.app$/.test(new URL(origin).hostname);

    if (isExactAllowed || isVercel) {
      return callback(null, true);
    } else {
      console.warn("[CORS] Blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Authorization", "Content-Type"],
};

// 🔥 Apply CORS middleware early
app.use(cors(corsOptions));

// 🔥 Handle all preflight requests
app.options("*", cors(corsOptions));

// ---- Debug Logger for CORS ----
app.use((req, res, next) => {
  console.log(`[CORS DEBUG] ${req.method} ${req.path} from ${req.headers.origin}`);
  next();
});

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

// ---- Body Parsing ----
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- MongoDB Connection ----
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-ordering", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---- Routes ----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/subadmin", require("./routes/subadmin"));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/qr", require("./routes/qr"));
app.use("/api/banner", require("./routes/banner"));

// ---- Health Check ----
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---- Integrations Health Check ----
app.get("/api/health/integrations", async (req, res) => {
  try {
    const emailStatus = await verifyEmailConfig();
    const whatsappStatus = { configured: !!isWhatsAppConfigured() };
    res.status(200).json({
      success: true,
      email: emailStatus,
      whatsapp: whatsappStatus,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// ---- Error Handling ----
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// ---- 404 Handler ----
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("[Startup] Allowed CORS Origins:", allowedOrigins);
  if (process.env.ALLOW_VERCEL_PATTERN === "true") {
    console.log("[Startup] Vercel wildcard CORS enabled for *.vercel.app");
  }

  verifyEmailConfig()
    .then((status) => {
      if (status.configured) {
        console.log("[Startup] Email transport verified: OK");
      } else {
        console.warn("[Startup] Email NOT configured:", status.error);
      }
    })
    .catch((e) => console.warn("[Startup] Email verify error:", e?.message || e));

  const waConfigured = isWhatsAppConfigured();
  console.log(`[Startup] WhatsApp configured: ${waConfigured ? "YES" : "NO"}`);
});

module.exports = app;
