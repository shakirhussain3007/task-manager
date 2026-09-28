const Task = require('../models/taskModel');
const { ApiError } = require('../middleware/errorHandler');
const { STATUS, PRIORITY } = require('../middleware/validate');

const oneOf = (v, list) => (list.includes(v) ? v : undefined);

exports.list = (req, res) => {
  const { status, priority, q, sort, order } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const { rows, total } = Task.findAll({
    status: oneOf(status, STATUS),
    priority: oneOf(priority, PRIORITY),
    q: q && String(q).slice(0, 100),
    sort, order, limit, offset: (page - 1) * limit,
  });
  res.set('X-Total-Count', String(total)).json(rows);
};

exports.get = (req, res) => {
  const task = Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json(task);
};

exports.create = (req, res) => res.status(201).json(Task.create(req.body));

exports.update = (req, res) => {
  const task = Task.update(req.params.id, req.body);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json(task);
};

exports.remove = (req, res) => {
  if (!Task.remove(req.params.id)) throw new ApiError(404, 'Task not found');
  res.status(204).end();
};

exports.stats = (req, res) => res.json(Task.stats());
