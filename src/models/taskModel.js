const db = require('../db');

const SORTABLE = ['id', 'title', 'priority', 'status', 'due_date', 'created_at', 'updated_at'];
const FIELDS = ['title', 'description', 'status', 'priority', 'due_date'];

function findAll({ status, priority, q, sort = 'id', order = 'desc', limit = 50, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (priority) { where.push('priority = ?'); params.push(priority); }
  if (q) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const col = SORTABLE.includes(sort) ? sort : 'id';
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM tasks ${clause}`).get(...params).n;
  const rows = db
    .prepare(`SELECT * FROM tasks ${clause} ORDER BY ${col} ${dir}, id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  return { rows, total };
}

const findById = (id) => db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

function create(data) {
  const info = db
    .prepare('INSERT INTO tasks (title, description, status, priority, due_date) VALUES (?,?,?,?,?)')
    .run(data.title.trim(), (data.description || '').trim(), data.status || 'todo', data.priority || 'medium', data.due_date || null);
  return findById(info.lastInsertRowid);
}

function update(id, data) {
  const current = findById(id);
  if (!current) return null;
  const next = { ...current };
  for (const f of FIELDS) if (f in data) next[f] = data[f];
  db.prepare(
    `UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).run(String(next.title).trim(), String(next.description || '').trim(), next.status, next.priority, next.due_date || null, id);
  return findById(id);
}

const remove = (id) => db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0;

function stats() {
  const today = new Date().toISOString().slice(0, 10);
  return db.prepare(`
    SELECT COUNT(*) AS total,
      COALESCE(SUM(status='todo'),0) AS todo,
      COALESCE(SUM(status='in_progress'),0) AS in_progress,
      COALESCE(SUM(status='done'),0) AS done,
      COALESCE(SUM(status!='done' AND due_date IS NOT NULL AND due_date < ?),0) AS overdue
    FROM tasks`).get(today);
}

module.exports = { findAll, findById, create, update, remove, stats };
