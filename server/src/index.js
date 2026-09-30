const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { connectDb } = require("./db");
const notesRoutes = require("./routes/notes");

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

async function main() {
  await connectDb(MONGODB_URI);

  const app = express();

  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: false,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/api", notesRoutes);

  app.use("/api", (req, res) => {
    res.status(404).json({ ok: false, error: "API route not found" });
  });

  app.use((err, req, res, next) => {
    console.error("[server error]", err);
    res.status(500).json({ ok: false, error: "internal server error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
