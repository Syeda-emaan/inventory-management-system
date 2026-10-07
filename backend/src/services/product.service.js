const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, paginated } = require('../utils/pagination');

const SORT_COLUMNS = {
  name: 'p.name',
  sku: 'p.sku',
  price: 'p.price',
  quantity: 'p.quantity',
  created_at: 'p.created_at',
};

// Search + filters ko WHERE clause mein badalta hai (parameterized, SQL injection se safe)
function buildFilters(q) {
  const where = ['p.deleted_at IS NULL'];
  const params = [];
  const push = (val) => { params.push(val); return `$${params.length}`; };

  if (q.search) {
    const ph = push(`%${q.search}%`);
    where.push(`(p.name ILIKE ${ph} OR p.sku ILIKE ${ph})`);
  }
  if (q.category_id) where.push(`p.category_id = ${push(Number(q.category_id))}`);
  if (q.min_price) where.push(`p.price >= ${push(Number(q.min_price))}`);
  if (q.max_price) where.push(`p.price <= ${push(Number(q.max_price))}`);
  if (q.low_stock === 'true') where.push('p.quantity <= p.reorder_level');
  if (q.supplier_id) {
    where.push(`EXISTS (SELECT 1 FROM product_suppliers ps
                        WHERE ps.product_id = p.id AND ps.supplier_id = ${push(Number(q.supplier_id))})`);
  }
  return { whereSql: where.join(' AND '), params };
}

async function list(q) {
  const { page, limit, offset } = getPagination(q);
  const { whereSql, params } = buildFilters(q);

  const sortCol = SORT_COLUMNS[q.sort] || SORT_COLUMNS.created_at;
  const order = String(q.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const total = (await query(`SELECT COUNT(*)::int AS n FROM products p WHERE ${whereSql}`, params)).rows[0].n;

  const { rows } = await query(
    `SELECT p.*, c.name AS category_name,
       (SELECT file_path FROM product_images i
         WHERE i.product_id = p.id ORDER BY i.is_primary DESC, i.id LIMIT 1) AS image
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${whereSql}
     ORDER BY ${sortCol} ${order}, p.id
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return paginated(rows, total, page, limit);
}

async function getById(id) {
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );
  if (!rows.length) throw new AppError('Product not found', 404);

  const images = (await query(
    'SELECT id, file_path, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, id', [id]
  )).rows;
  const suppliers = (await query(
    `SELECT s.id, s.name, s.email, s.phone, ps.supply_price
     FROM product_suppliers ps JOIN suppliers s ON s.id = ps.supplier_id
     WHERE ps.product_id = $1`, [id]
  )).rows;

  return { ...rows[0], images, suppliers };
}

async function create(data) {
  const { suppliers = [], quantity, ...p } = data;
  const id = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO products (sku, name, description, price, category_id, quantity, reorder_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [p.sku, p.name, p.description ?? null, p.price, p.category_id ?? null, quantity, p.reorder_level]
    );
    const productId = rows[0].id;

    if (quantity > 0) {
      await client.query(
        `INSERT INTO inventory_history (product_id, change_type, quantity_change, quantity_after, reason)
         VALUES ($1, 'IN', $2, $2, 'Initial stock')`,
        [productId, quantity]
      );
    }
    for (const s of suppliers) {
      await client.query(
        'INSERT INTO product_suppliers (product_id, supplier_id, supply_price) VALUES ($1,$2,$3)',
        [productId, s.supplier_id, s.supply_price ?? null]
      );
    }
    return productId;
  });
  return getById(id);
}

async function update(id, data) {
  const { suppliers, ...fields } = data;
  const keys = Object.keys(fields);

  await withTransaction(async (client) => {
    if (keys.length) {
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const r = await client.query(
        `UPDATE products SET ${set}, updated_at = now()
         WHERE id = $${keys.length + 1} AND deleted_at IS NULL`,
        [...keys.map((k) => fields[k]), id]
      );
      if (!r.rowCount) throw new AppError('Product not found', 404);
    } else {
      const r = await client.query('SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (!r.rowCount) throw new AppError('Product not found', 404);
    }

    if (suppliers) {
      await client.query('DELETE FROM product_suppliers WHERE product_id = $1', [id]);
      for (const s of suppliers) {
        await client.query(
          'INSERT INTO product_suppliers (product_id, supplier_id, supply_price) VALUES ($1,$2,$3)',
          [id, s.supplier_id, s.supply_price ?? null]
        );
      }
    }
  });
  return getById(id);
}

// Soft delete: history rows safe rehti hain
async function remove(id) {
  const r = await query('UPDATE products SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', [id]);
  if (!r.rowCount) throw new AppError('Product not found', 404);
}

module.exports = { buildFilters, SORT_COLUMNS, list, getById, create, update, remove };