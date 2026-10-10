const express = require("express");
const cors = require("cors");
const notesRoutes = require("./routes/notes");

function createApp(corsOrigin = "http://localhost:5173") {
  const app = express();

  // Set default JSON Content-Type header
  app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
  });

  app.use(
    cors({
      origin: corsOrigin,
      credentials: false,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Routes
  app.use("/api", notesRoutes);

  // 404 handler for unknown API routes
  app.use("/api", (req, res) => {
    res.status(404).json({ ok: false, error: "API route not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("[server error]", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
