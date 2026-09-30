import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadNotes() {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.notes ?? []);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function addNote(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create note");
      setText("");
      await loadNotes();
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(id) {
    setBusy(true);
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      await loadNotes();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <h1>MERN Deploy Demo</h1>

      <section className="card">
        <h2>Notes</h2>

        <form onSubmit={addNote} className="row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a note (max 280 chars)"
            maxLength={280}
          />
          <button disabled={busy || !text.trim()}>Add</button>
        </form>

        <ul className="list">
          {notes.map((n) => (
            <li key={n._id} className="item">
              <div>
                <div className="text">{n.text}</div>
                <div className="meta">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                className="danger"
                onClick={() => deleteNote(n._id)}
                disabled={busy}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        {!notes.length && <p className="muted">No notes yet. Add one.</p>}
      </section>
    </div>
  );
}
