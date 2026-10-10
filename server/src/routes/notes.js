const express = require("express");
const Note = require("../models/Note");
const { isDbConnected } = require("../db");

const router = express.Router();

// In-memory fallback notes in case MongoDB Atlas is disconnected or IP is not whitelisted
let inMemoryNotes = [
  {
    _id: "demo_1",
    text: "[Deploy] Initialized VPS container stack and Express API gateway",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo_2",
    text: "[Task] Configure Nginx reverse proxy SSL certificates",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Health check endpoint
router.get("/health", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    ok: true,
    status: "healthy",
    dbConnected: isDbConnected(),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/notes
router.get("/notes", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    if (isDbConnected()) {
      const notes = await Note.find().sort({ createdAt: -1 }).limit(50);
      return res.json({ ok: true, notes, source: "mongodb" });
    }

    // Fallback if MongoDB is not connected yet
    return res.json({
      ok: true,
      notes: inMemoryNotes,
      source: "memory_fallback",
      warning:
        "MongoDB Atlas is currently offline or your IP address is not whitelisted in Atlas Network Access. Operating with in-memory storage.",
    });
  } catch (err) {
    console.error("[notes route error]", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Failed to fetch notes",
    });
  }
});

// POST /api/notes
router.post("/notes", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const text = String(req.body?.text ?? "").trim();
    if (!text) {
      return res.status(400).json({ ok: false, error: "text is required" });
    }

    if (isDbConnected()) {
      const note = await Note.create({ text });
      return res.status(201).json({ ok: true, note, source: "mongodb" });
    }

    // In-memory fallback
    const newNote = {
      _id: "mem_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      createdAt: new Date().toISOString(),
    };
    inMemoryNotes.unshift(newNote);

    return res.status(201).json({
      ok: true,
      note: newNote,
      source: "memory_fallback",
    });
  } catch (err) {
    console.error("[create note error]", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Failed to create note",
    });
  }
});

// DELETE /api/notes/:id
router.delete("/notes/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await Note.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ ok: false, error: "not found" });
      }
      return res.json({ ok: true, source: "mongodb" });
    }

    // In-memory fallback
    const initialLen = inMemoryNotes.length;
    inMemoryNotes = inMemoryNotes.filter((n) => n._id !== id);
    if (inMemoryNotes.length === initialLen) {
      return res.status(404).json({ ok: false, error: "not found" });
    }

    return res.json({ ok: true, source: "memory_fallback" });
  } catch (err) {
    console.error("[delete note error]", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Failed to delete note",
    });
  }
});

module.exports = router;
