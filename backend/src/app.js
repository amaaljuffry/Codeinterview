// backend/src/app.js - Express application setup
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/auth.js";
import roomsRoutes from "./routes/rooms.js";
import usersRoutes from "./routes/users.js";
import executeRoutes from "./routes/execute.js";
import questionsRoutes from "./routes/questions.js";
import scheduleRoutes from "./routes/schedule.js";

// Swagger
import { setupSwagger } from "./config/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/schedule", scheduleRoutes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/version:
 *   get:
 *     summary: Get API version
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API version info
 */
app.get("/api/version", (req, res) => {
  res.json({ 
    version: "1.0.0",
    name: "Code Interview Platform API",
    environment: process.env.NODE_ENV || "development"
  });
});

// Serve static files in production
const clientDist = path.join(__dirname, "..", "..", "frontend", "dist");

// Only serve static files if dist folder exists (production build)
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // SPA fallback - serve index.html for all routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  // Development mode - just return a helpful message
  app.get("/", (req, res) => {
    res.json({ 
      message: "API server running. Use http://localhost:5173 for the frontend in development.",
      api: "/api/rooms"
    });
  });
}

export default app;
