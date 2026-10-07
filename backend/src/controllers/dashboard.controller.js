const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.summary = asyncHandler(async (req, res) => {
  const stats = (await query(
    `SELECT COUNT(*)::int AS total_products,
            COUNT(*) FILTER (WHERE quantity <= reorder_level)::int AS low_stock,
            COUNT(*) FILTER (WHERE quantity = 0)::int AS out_of_stock,
            COALESCE(SUM(quantity * price), 0)::float AS inventory_value
     FROM products WHERE deleted_at IS NULL`
  )).rows[0];

  const recent = (await query(
    `SELECT h.*, p.name AS product_name, p.sku
     FROM inventory_history h JOIN products p ON p.id = h.product_id
     ORDER BY h.created_at DESC, h.id DESC LIMIT 10`
  )).rows;

  res.json({ success: true, data: { ...stats, recent_movements: recent } });
});