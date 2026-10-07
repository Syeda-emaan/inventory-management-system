const router = require('express').Router();
const c = require('../controllers/stock.controller');

router.get('/history', c.allHistory);

module.exports = router;