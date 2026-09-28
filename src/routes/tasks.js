const router = require('express').Router();
const ctrl = require('../controllers/taskController');
const { validateBody, validateId } = require('../middleware/validate');

router.param('id', validateId);

router.get('/stats', ctrl.stats);
router.route('/').get(ctrl.list).post(validateBody(false), ctrl.create);
router.route('/:id').get(ctrl.get).put(validateBody(true), ctrl.update).delete(ctrl.remove);

module.exports = router;
