const $ = (s) => document.querySelector(s);
const LABEL = { todo: "To Do", in_progress: "In Progress", done: "Done" };
let filter = "",
  search = "";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(
      [e.error, ...(e.details || [])].filter(Boolean).join(": ") ||
        "Request failed",
    );
  }
  return res.status === 204 ? null : res.json();
}

function showError(msg) {
  const el = $("#error");
  el.textContent = msg || "";
  el.hidden = !msg;
}

async function load() {
  const qs = new URLSearchParams();
  if (filter) qs.set("status", filter);
  if (search) qs.set("q", search);
  try {
    const [tasks, stats] = await Promise.all([
      api("/api/tasks?" + qs),
      api("/api/tasks/stats"),
    ]);
    renderStats(stats);
    renderList(tasks);
  } catch (e) {
    showError(e.message);
  }
}

function renderStats(s) {
  $("#stats").innerHTML = [
    ["Total", s.total],
    ["To Do", s.todo],
    ["In Progress", s.in_progress],
    ["Done", s.done],
    ["Overdue", s.overdue],
  ]
    .map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`)
    .join("");
  $("#bar-fill").style.width =
    (s.total ? Math.round((s.done / s.total) * 100) : 0) + "%";
}

function renderList(tasks) {
  const today = new Date().toISOString().slice(0, 10);
  $("#list").innerHTML = tasks.length
    ? tasks
        .map((t) => {
          const late = t.due_date && t.status !== "done" && t.due_date < today;
          return `<article class="task ${t.priority} ${t.status}" data-id="${t.id}">
      <div class="t-top">
        <div><div class="t-title">${esc(t.title)}</div>
        ${t.description ? `<div class="t-desc">${esc(t.description)}</div>` : ""}</div>
        <div class="actions">
          <select data-act="status">${Object.entries(LABEL)
            .map(
              ([k, v]) =>
                `<option value="${k}" ${k === t.status ? "selected" : ""}>${v}</option>`,
            )
            .join("")}</select>
          <button class="btn sm" data-act="edit">Edit</button>
          <button class="btn sm danger" data-act="delete">Delete</button>
        </div>
      </div>
      <div class="meta">
        <span class="badge">${t.priority} priority</span>
        ${t.due_date ? `<span class="${late ? "overdue" : ""}">Due ${esc(t.due_date)}${late ? " (overdue)" : ""}</span>` : ""}
      </div></article>`;
        })
        .join("")
    : '<div class="empty">No tasks found. Add one above!</div>';
}

function resetForm() {
  $("#task-form").reset();
  $("#task-id").value = "";
  $("#form-title").textContent = "New task";
  $("#save-btn").textContent = "Add task";
  $("#cancel-btn").hidden = true;
  showError("");
}

$("#task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("#task-id").value;
  const body = {
    title: $("#title").value,
    description: $("#description").value,
    priority: $("#priority").value,
    status: $("#status").value,
    due_date: $("#due_date").value || null,
  };
  try {
    await api(id ? `/api/tasks/${id}` : "/api/tasks", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body),
    });
    resetForm();
    load();
  } catch (err) {
    showError(err.message);
  }
});

$("#cancel-btn").addEventListener("click", resetForm);

$("#list").addEventListener("click", async (e) => {
  const act = e.target.dataset.act;
  const id = e.target.closest(".task")?.dataset.id;
  if (!act || !id) return;
  try {
    if (act === "delete" && confirm("Delete this task?")) {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      load();
    }
    if (act === "edit") {
      const t = (await api("/api/tasks")).find((x) => x.id == id);
      $("#task-id").value = t.id;
      $("#title").value = t.title;
      $("#description").value = t.description;
      $("#priority").value = t.priority;
      $("#status").value = t.status;
      $("#due_date").value = t.due_date || "";
      $("#form-title").textContent = "Edit task";
      $("#save-btn").textContent = "Save changes";
      $("#cancel-btn").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } catch (err) {
    showError(err.message);
  }
});

$("#list").addEventListener("change", async (e) => {
  if (e.target.dataset.act !== "status") return;
  const id = e.target.closest(".task").dataset.id;
  try {
    await api(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: e.target.value }),
    });
    load();
  } catch (err) {
    showError(err.message);
  }
});

$("#tabs").addEventListener("click", (e) => {
  if (!e.target.dataset.hasOwnProperty("f")) return;
  filter = e.target.dataset.f;
  document
    .querySelectorAll("#tabs button")
    .forEach((b) => b.classList.toggle("active", b === e.target));
  load();
});

let timer;
$("#search").addEventListener("input", (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    search = e.target.value.trim();
    load();
  }, 250);
});

load();
