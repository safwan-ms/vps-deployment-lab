const dotenv = require("dotenv");
const { createApp } = require("./app");
const { connectDb, initAutoReconnect } = require("./db");

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const app = createApp(CORS_ORIGIN);

const server = app.listen(PORT, "0.0.0.0", () => {
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

module.exports = { server, app };
