const router = require('express').Router();
const product = require('../controllers/product.controller');
const stock = require('../controllers/stock.controller');
const image = require('../controllers/image.controller');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');
const { stockSchema } = require('../validators/stock.validator');

// NOTE: /export/csv ko hamesha /:id se pehle rakhein
router.get('/export/csv', product.exportCsv);

router.get('/', product.list);
router.post('/', validate(createProductSchema), product.create);
router.get('/:id', product.getOne);
router.put('/:id', validate(updateProductSchema), product.update);
router.delete('/:id', product.remove);

// Stock
router.post('/:id/stock', validate(stockSchema), stock.change);
router.get('/:id/history', stock.productHistory);

// Images
router.post('/:id/images', upload.array('images', 5), image.upload);
router.patch('/:id/images/:imageId/primary', image.setPrimary);
router.delete('/:id/images/:imageId', image.remove);

module.exports = router;