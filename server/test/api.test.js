const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createApp } = require("../src/app");

test("API Endpoints Integration Tests", async (t) => {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  await t.test("GET /api/health returns 200 and healthy status", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.status, "healthy");
  });

  await t.test("GET /api/notes returns 200 and an array of notes", async () => {
    const res = await fetch(`${baseUrl}/api/notes`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.notes));
  });

  let createdNoteId = null;

  await t.test("POST /api/notes creates a new note successfully", async () => {
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Test CI note deployment verification" }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.note.text, "Test CI note deployment verification");
    assert.ok(data.note._id);
    createdNoteId = data.note._id;
  });

  await t.test("POST /api/notes with empty text returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error, "text is required");
  });

  await t.test("DELETE /api/notes/:id deletes created note", async () => {
    if (!createdNoteId) return;
    const res = await fetch(`${baseUrl}/api/notes/${createdNoteId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });

  await t.test("GET /api/nonexistent returns 404 JSON", async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.ok, false);
  });
});
