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

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Adjust for your needs
}));
app.use(morgan("combined"));

// Production CORS - Allow your domain
app.use(cors({
  origin: [
    'https://sellhubshop.co.ke',
    'https://www.sellhubshop.co.ke',
    'http://localhost:3000' // For local development if needed
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/mpesa", mpesaRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Sale Stream Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    domain: "sellhubshop.co.ke"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Production Error:", error);
  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Production Backend running on port ${PORT}`);
  console.log(`📱 M-Pesa API: https://sellhubshop.co.ke/api/mpesa`);
  console.log(`🏥 Health check: https://sellhubshop.co.ke/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});