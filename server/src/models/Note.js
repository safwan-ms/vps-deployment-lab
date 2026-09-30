const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 280 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Note", NoteSchema);
