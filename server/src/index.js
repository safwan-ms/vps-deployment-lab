const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { connectDb, initAutoReconnect } = require("./db");
const notesRoutes = require("./routes/notes");

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

function main() {
  const app = express();

  // Explicitly ensure JSON content type by default
  app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
  });

  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: false,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Routes
  app.use("/api", notesRoutes);

  // 404 handler for API routes
  app.use("/api", (req, res) => {
    res.status(404).json({ ok: false, error: "API route not found" });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error("[server error]", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  });

  // Start HTTP Server immediately so API is never down
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] JSON API listening on http://localhost:${PORT}`);

    // Asynchronously connect to MongoDB Atlas in background
    if (MONGODB_URI) {
      connectDb(MONGODB_URI).then((ok) => {
        if (!ok) {
          initAutoReconnect(MONGODB_URI);
        }
      });
    } else {
      console.warn("[server] No MONGODB_URI found. Running in local fallback mode.");
    }
  });
}

main();
