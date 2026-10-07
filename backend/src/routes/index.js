const router = require('express').Router();
const { query } = require('../config/db');
const dashboard = require('../controllers/dashboard.controller');

router.get('/health', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT now() AS time');
    res.json({ success: true, status: 'ok', dbTime: rows[0].time });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', dashboard.summary);
router.use('/categories', require('./category.routes'));
router.use('/suppliers', require('./supplier.routes'));
router.use('/products', require('./product.routes'));
router.use('/stock', require('./stock.routes'));

module.exports = router;