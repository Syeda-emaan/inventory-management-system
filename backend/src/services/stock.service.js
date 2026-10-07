const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, paginated } = require('../utils/pagination');

async function changeStock(productId, { change_type, quantity, reason }) {
  return withTransaction(async (client) => {
    // FOR UPDATE row ko lock karta hai, taake do requests ek saath stock kharab na karein
    const { rows } = await client.query(
      'SELECT id, quantity FROM products WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
      [productId]
    );
    if (!rows.length) throw new AppError('Product not found', 404);

    const current = rows[0].quantity;
    let after;

    if (change_type === 'IN') {
      if (quantity <= 0) throw new AppError('Quantity must be greater than 0', 400);
      after = current + quantity;
    } else if (change_type === 'OUT') {
      if (quantity <= 0) throw new AppError('Quantity must be greater than 0', 400);
      after = current - quantity;
      if (after < 0) throw new AppError(`Insufficient stock. Available: ${current}`, 400);
    } else {
      after = quantity; // ADJUST: quantity naya total hai
    }
    const change = after - current;

    await client.query('UPDATE products SET quantity = $1, updated_at = now() WHERE id = $2', [after, productId]);

    const hist = await client.query(
      `INSERT INTO inventory_history (product_id, change_type, quantity_change, quantity_after, reason)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [productId, change_type, change, after, reason || null]
    );
    return { product_id: Number(productId), quantity: after, history: hist.rows[0] };
  });
}

async function getHistory(productId, q) {
  const { page, limit, offset } = getPagination(q);
  const exists = await query('SELECT 1 FROM products WHERE id = $1', [productId]);
  if (!exists.rowCount) throw new AppError('Product not found', 404);

  const total = (await query('SELECT COUNT(*)::int AS n FROM inventory_history WHERE product_id = $1', [productId])).rows[0].n;
  const { rows } = await query(
    `SELECT * FROM inventory_history WHERE product_id = $1
     ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );
  return paginated(rows, total, page, limit);
}

async function getAllHistory(q) {
  const { page, limit, offset } = getPagination(q);
  const total = (await query('SELECT COUNT(*)::int AS n FROM inventory_history')).rows[0].n;
  const { rows } = await query(
    `SELECT h.*, p.name AS product_name, p.sku
     FROM inventory_history h JOIN products p ON p.id = h.product_id
     ORDER BY h.created_at DESC, h.id DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return paginated(rows, total, page, limit);
}

module.exports = { changeStock, getHistory, getAllHistory };