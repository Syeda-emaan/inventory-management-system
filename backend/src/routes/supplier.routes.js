const router = require('express').Router();
const c = require('../controllers/supplier.controller');
const validate = require('../middlewares/validate');
const { supplierSchema, supplierUpdateSchema } = require('../validators/supplier.validator');

router.get('/', c.list);
router.post('/', validate(supplierSchema), c.create);
router.get('/:id', c.getOne);
router.put('/:id', validate(supplierUpdateSchema), c.update);
router.delete('/:id', c.remove);

module.exports = router;