import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Routes
import mpesaRoutes from "./routes/mpesa.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(morgan("combined"));

// Production CORS
const allowedOrigins = [
  'https://sellhubshop.co.ke',
  'https://www.sellhubshop.co.ke',
  'https://sellhubshop-backend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/mpesa", mpesaRoutes);

// Health check with detailed info
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SellHubShop Production Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    domain: "sellhubshop.co.ke",
    version: "1.0.0"
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "🚀 SellHubShop Production API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      mpesa: "/api/mpesa",
      documentation: "https://docs.sellhubshop.co.ke"
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    documentation: "https://docs.sellhubshop.co.ke"
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("💥 Production Error:", {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
    errorId: Date.now().toString(36),
    ...(process.env.NODE_ENV === "development" && { 
      error: error.message,
      stack: error.stack 
    }),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PRODUCTION Backend running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📱 M-Pesa API: https://sellhubshop-backend.onrender.com/api/mpesa`);
  console.log(`📞 Callback URL: https://sellhubshop-backend.onrender.com/api/mpesa/callback`);
  console.log(`🏥 Health: https://sellhubshop-backend.onrender.com/api/health`);
  console.log(`🔐 Mode: ${process.env.NODE_ENV === 'production' ? 'LIVE M-Pesa' : 'Sandbox'}`);
});
