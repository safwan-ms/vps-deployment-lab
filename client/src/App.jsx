import { useEffect, useState, useMemo, useRef } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  X,
  Server,
  Activity,
  Clock,
  RefreshCw,
  FileText,
  Terminal,
  Zap,
  Rocket,
  Lightbulb,
  Bug,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import "./App.css";

const CATEGORY_TAGS = [
  { label: "Deploy", icon: Rocket, prefix: "[Deploy] " },
  { label: "Idea", icon: Lightbulb, prefix: "[Idea] " },
  { label: "Task", icon: Zap, prefix: "[Task] " },
  { label: "Bug", icon: Bug, prefix: "[Bug] " },
  { label: "Memo", icon: Bookmark, prefix: "[Memo] " },
];

function formatRelativeTime(dateString) {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 45) return "just now";
  if (diffSec < 90) return "1 min ago";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function extractTag(text) {
  const match = text.match(/^\[(.*?)\]/);
  if (match) return match[1];
  return null;
}

function cleanNoteText(text) {
  return text.replace(/^\[.*?\]\s*/, "");
}

async function parseJsonResponse(res) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      res.ok
        ? "Received non-JSON response from server"
        : `Server error (${res.status}): ${text.slice(0, 100) || "Unable to reach API"}`
    );
  }
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [serverStatus, setServerStatus] = useState("checking"); // 'online' | 'offline' | 'checking'
  const [dbSource, setDbSource] = useState(null);
  const [dbWarning, setDbWarning] = useState(null);
  const [latency, setLatency] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);
  const textareaRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 3200);
  };

  async function loadNotes(isBackground = false) {
    if (!isBackground) setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/notes");
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);

      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Server responded with error");

      setNotes(data.notes ?? []);
      setDbSource(data.source ?? "unknown");
      setDbWarning(data.warning ?? null);
      setServerStatus("online");
    } catch (err) {
      console.error("API error:", err);
      setServerStatus("offline");
      setDbSource(null);
      if (!isBackground) {
        showToast("Backend connection error: " + err.message, "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
    const interval = setInterval(() => {
      loadNotes(true);
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addNote(e) {
    if (e) e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;

    setBusy(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to create note");

      setText("");
      showToast("Note published successfully!");
      await loadNotes(true);
      if (textareaRef.current) textareaRef.current.focus();
    } catch (err) {
      showToast(err.message || "Failed to save note", "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(id) {
    setBusy(true);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not delete note");
      showToast("Note deleted successfully");
      await loadNotes(true);
    } catch (err) {
      showToast(err.message || "Error deleting note", "error");
    } finally {
      setBusy(false);
    }
  }

  const handleCopy = (id, textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    showToast("Copied note content to clipboard!");
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      addNote();
    }
  };

  const insertTag = (prefix) => {
    // If text already has a [Tag], replace it or prepend
    const cleaned = text.replace(/^\[.*?\]\s*/, "");
    setText(prefix + cleaned);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const tag = extractTag(n.text);
      const matchesCategory =
        activeCategory === "All" ||
        (tag && tag.toLowerCase() === activeCategory.toLowerCase());

      const matchesSearch =
        searchQuery === "" ||
        n.text.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [notes, activeCategory, searchQuery]);

  const maxChars = 280;
  const charsLeft = maxChars - text.length;
  const charPercent = Math.min(100, (text.length / maxChars) * 100);

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "error" ? (
            <AlertTriangle className="toast-icon" size={18} />
          ) : (
            <CheckCircle2 className="toast-icon" size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Status Bar */}
      <header className="header">
        <div className="header-brand">
          <div className="logo-box">
            <Sparkles className="logo-icon" size={22} />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">PulseNode</h1>
              <span className="brand-pill">v1.4 &bull; CD Active 🚀</span>
            </div>
            <p className="brand-subtitle">VPS Deployment Lab &bull; Micro-Notes Engine &bull; Continuous Deployment Active</p>
          </div>
        </div>

        <div className="header-status-group">
          {/* Server Connection Badge */}
          <div className={`status-badge status-${serverStatus}`}>
            <span className="status-ping"></span>
            <Server size={14} />
            <span className="status-label">
              {serverStatus === "online"
                ? `JSON API Online ${latency ? `(${latency}ms)` : ""}`
                : serverStatus === "checking"
                ? "Connecting..."
                : "API Offline"}
            </span>
          </div>

          {/* DB Mode Pill */}
          {serverStatus === "online" && (
            <div
              className={`status-badge ${
                dbSource === "mongodb" ? "status-online" : "status-checking"
              }`}
              title={
                dbSource === "mongodb"
                  ? "Connected to MongoDB Atlas cluster"
                  : "Running on in-memory cache until MongoDB Atlas IP is whitelisted"
              }
            >
              <Activity size={13} />
              <span className="status-label">
                {dbSource === "mongodb" ? "Atlas DB" : "In-Memory Mode"}
              </span>
            </div>
          )}

          {/* Quick Refresh */}
          <button
            className={`btn-icon ${loading ? "spinning" : ""}`}
            onClick={() => loadNotes()}
            title="Refresh notes from server"
            aria-label="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Atlas IP Notice if running in fallback */}
      {dbWarning && (
        <div className="db-notice-banner">
          <AlertTriangle size={16} className="text-warn" />
          <div className="db-notice-text">
            <strong>MongoDB Atlas Notice:</strong> Current IP address (<code>157.48.122.156</code>) needs to be added to your Atlas IP Access List to persist data to cloud. Serving via in-memory storage in the meantime.
          </div>
        </div>
      )}

      {/* Main Grid: Composer & Stream */}
      <main className="main-content">
        {/* Composer Card */}
        <section className="card composer-card">
          <div className="composer-header">
            <div className="section-title-wrap">
              <Terminal size={18} className="accent-icon" />
              <h2 className="section-title">New Note</h2>
            </div>
            <span className="composer-hint">Press ⌘/Ctrl + Enter to post</span>
          </div>

          {/* Quick Tag Pills */}
          <div className="tag-picker">
            <span className="tag-picker-label">Tags:</span>
            {CATEGORY_TAGS.map((cat) => {
              const isSelected = text.startsWith(cat.prefix);
              const TagIcon = cat.icon;
              return (
                <button
                  type="button"
                  key={cat.label}
                  className={`tag-chip ${isSelected ? "tag-chip-active" : ""}`}
                  onClick={() => insertTag(cat.prefix)}
                >
                  <TagIcon size={12} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={addNote} className="composer-form">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Log a deployment update, quick idea, or system memo..."
                maxLength={maxChars}
                rows={3}
                className="composer-textarea"
              />
            </div>

            <div className="composer-footer">
              {/* Character Counter Progress */}
              <div className="char-counter-wrap">
                <div className="char-bar-track">
                  <div
                    className={`char-bar-fill ${
                      charsLeft < 20
                        ? "char-danger"
                        : charsLeft < 60
                        ? "char-warn"
                        : ""
                    }`}
                    style={{ width: `${charPercent}%` }}
                  />
                </div>
                <span
                  className={`char-count ${
                    charsLeft < 20 ? "char-count-alert" : ""
                  }`}
                >
                  {charsLeft} left
                </span>
              </div>

              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="btn-primary"
              >
                {busy ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Publish Note</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Toolbar: Stats & Filter */}
        <div className="toolbar">
          {/* Search bar */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="filter-tabs">
            {["All", "Deploy", "Idea", "Task", "Bug", "Memo"].map((cat) => (
              <button
                key={cat}
                className={`tab-btn ${activeCategory === cat ? "tab-active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                {cat === "All" && (
                  <span className="tab-badge">{notes.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Stream */}
        <section className="notes-section">
          {loading && !notes.length ? (
            <div className="loading-state">
              <RefreshCw size={28} className="spinning text-accent" />
              <p>Fetching notes from database...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon-box">
                <FileText size={36} />
              </div>
              <h3 className="empty-title">
                {searchQuery || activeCategory !== "All"
                  ? "No matching notes found"
                  : "No notes logged yet"}
              </h3>
              <p className="empty-desc">
                {searchQuery || activeCategory !== "All"
                  ? "Try adjusting your search query or switching categories."
                  : "Your database is empty. Post a deployment memo or system note above to get started!"}
              </p>
              {searchQuery || activeCategory !== "All" ? (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setText("[Deploy] Verified Nginx reverse proxy & MongoDB SSL")
                  }
                >
                  <Sparkles size={14} />
                  <span>Insert Starter Note</span>
                </button>
              )}
            </div>
          ) : (
            <div className="notes-grid">
              {filteredNotes.map((note) => {
                const tag = extractTag(note.text);
                const cleanText = cleanNoteText(note.text);
                const isCopied = copiedId === note._id;

                return (
                  <article key={note._id} className="note-card">
                    <div className="note-card-top">
                      {tag ? (
                        <span className={`note-tag tag-${tag.toLowerCase()}`}>
                          {tag}
                        </span>
                      ) : (
                        <span className="note-tag tag-default">Note</span>
                      )}

                      <div className="note-card-actions">
                        <button
                          className={`btn-icon-subtle ${isCopied ? "btn-copied" : ""}`}
                          onClick={() => handleCopy(note._id, note.text)}
                          title="Copy content"
                          aria-label="Copy note"
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          className="btn-icon-subtle btn-danger"
                          onClick={() => deleteNote(note._id)}
                          disabled={busy}
                          title="Delete note"
                          aria-label="Delete note"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="note-body">{cleanText}</p>

                    <div className="note-footer">
                      <div
                        className="note-time"
                        title={new Date(note.createdAt).toLocaleString()}
                      >
                        <Clock size={12} />
                        <span>{formatRelativeTime(note.createdAt)}</span>
                      </div>
                      <span className="note-id-pill">
                        #{note._id ? note._id.slice(-4) : "memo"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">
          <Activity size={14} className="footer-icon" />
          <span>MERN Cluster Deployment Active &bull; CD Pipeline Verified</span>
        </div>
        <div className="footer-right">
          <span>{notes.length} total entries recorded</span>
        </div>
      </footer>
    </div>
  );
}
