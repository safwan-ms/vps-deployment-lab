const express = require("express");
const Note = require("../models/Note");

const router = express.Router();

router.get("/notes", async (req, res) => {
  const notes = await Note.find().sort({ createdAt: -1 }).limit(50);
  res.json({ ok: true, notes });
});

router.post("/notes", async (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text)
    return res.status(400).json({ ok: false, error: "text is required" });

  const note = await Note.create({ text });
  res.status(201).json({ ok: true, note });
});

router.delete("/notes/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await Note.findByIdAndDelete(id);

  if (!deleted) return res.status(404).json({ ok: false, error: "not found" });
  res.json({ ok: true });
});

module.exports = router;
