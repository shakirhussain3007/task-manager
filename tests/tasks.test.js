process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

let server, base;
test.before(() => new Promise((resolve) => {
  server = createApp().listen(0, () => { base = `http://127.0.0.1:${server.address().port}/api`; resolve(); });
}));
test.after(() => server.close());

const call = (p, method = 'GET', body) =>
  fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });

test('creates a task with defaults', async () => {
  const res = await call('/tasks', 'POST', { title: '  Write report ' });
  assert.equal(res.status, 201);
  const t = await res.json();
  assert.equal(t.title, 'Write report');
  assert.equal(t.status, 'todo');
  assert.equal(t.priority, 'medium');
});

test('rejects invalid input', async () => {
  assert.equal((await call('/tasks', 'POST', { priority: 'high' })).status, 400);
  assert.equal((await call('/tasks', 'POST', { title: 'x', status: 'bogus' })).status, 400);
  assert.equal((await call('/tasks', 'POST', { title: 'x', due_date: '31-12-2026' })).status, 400);
});

test('updates, filters and searches', async () => {
  const { id } = await (await call('/tasks', 'POST', { title: 'Deploy app', priority: 'high' })).json();
  const up = await call(`/tasks/${id}`, 'PUT', { status: 'done' });
  assert.equal((await up.json()).status, 'done');
  const list = await call('/tasks?status=done&q=deploy');
  assert.equal(list.headers.get('x-total-count'), '1');
  assert.equal((await list.json())[0].id, id);
});

test('stats reflect data', async () => {
  const s = await (await call('/tasks/stats')).json();
  assert.ok(s.total >= 2 && s.done >= 1);
});

test('deletes and returns 404 afterwards', async () => {
  const { id } = await (await call('/tasks', 'POST', { title: 'Temp' })).json();
  assert.equal((await call(`/tasks/${id}`, 'DELETE')).status, 204);
  assert.equal((await call(`/tasks/${id}`)).status, 404);
  assert.equal((await call('/tasks/abc')).status, 400);
});
