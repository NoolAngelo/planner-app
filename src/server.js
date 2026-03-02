require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// Import database
const { sequelize } = require("../models");

// Import routes
const authRoutes = require("../routes/auth");
const userRoutes = require("../routes/users");
const taskRoutes = require("../routes/tasks");
const projectRoutes = require("../routes/projects");
const tagRoutes = require("../routes/tags");
const attachmentRoutes = require("../routes/attachments");

// Import middleware
const errorHandler = require("../middleware/errorHandler");
const notFound = require("../middleware/notFound");

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Backend server is running!",
    port: PORT,
  });
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Placeholder routes
app.get("/api/auth/test", (req, res) => {
  res.json({ message: "Auth routes working" });
});

app.get("/api/tasks/test", (req, res) => {
  res.json({ message: "Task routes working" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/attachments", attachmentRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("[OK] Database connected successfully");

    // Sync database models (only in development)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("[OK] Database models synchronized");
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
      console.log(`[SERVER] Test API: http://localhost:${PORT}/api/test`);
    });
  } catch (error) {
    console.error("[ERROR] Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

startServer();
