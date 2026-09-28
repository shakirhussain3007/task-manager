const { ApiError } = require('./errorHandler');

const STATUS = ['todo', 'in_progress', 'done'];
const PRIORITY = ['low', 'medium', 'high'];

const rules = {
  title: (v) => (typeof v === 'string' && v.trim().length >= 1 && v.length <= 150) || 'title must be 1-150 characters',
  description: (v) => v == null || (typeof v === 'string' && v.length <= 2000) || 'description must be at most 2000 characters',
  status: (v) => STATUS.includes(v) || `status must be one of: ${STATUS.join(', ')}`,
  priority: (v) => PRIORITY.includes(v) || `priority must be one of: ${PRIORITY.join(', ')}`,
  due_date: (v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v))) || 'due_date must be a valid YYYY-MM-DD date',
};

const validateBody = (partial = false) => (req, res, next) => {
  const b = req.body;
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw new ApiError(400, 'Body must be a JSON object');
  const errors = [];
  if (!partial && !('title' in b)) errors.push('title is required');
  for (const [key, check] of Object.entries(rules)) {
    if (key in b) {
      const result = check(b[key]);
      if (result !== true) errors.push(result);
    }
  }
  if (partial && !Object.keys(b).some((k) => k in rules)) errors.push('No updatable fields provided');
  if (errors.length) throw new ApiError(400, 'Validation failed', errors);
  next();
};

const validateId = (req, res, next, id) => {
  if (!/^\d+$/.test(id)) throw new ApiError(400, 'Task id must be a positive integer');
  next();
};

module.exports = { validateBody, validateId, STATUS, PRIORITY };
