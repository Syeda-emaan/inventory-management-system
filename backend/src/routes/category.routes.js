const router = require('express').Router();
const c = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const { categorySchema, categoryUpdateSchema } = require('../validators/category.validator');

router.get('/', c.list);
router.post('/', validate(categorySchema), c.create);
router.get('/:id', c.getOne);
router.put('/:id', validate(categoryUpdateSchema), c.update);
router.delete('/:id', c.remove);

module.exports = router;