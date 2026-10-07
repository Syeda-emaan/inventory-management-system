const { format } = require('fast-csv');
const { query } = require('../config/db');
const { buildFilters } = require('./product.service');

// 1000-1000 rows ke batch mein padhta hai, memory mein sab load nahi karta
async function streamProductsCsv(q, res) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`);

  const csv = format({ headers: true });
  csv.pipe(res);

  const { whereSql, params } = buildFilters(q);
  const BATCH = 1000;
  let lastId = 0;

  try {
    while (true) {
      const { rows } = await query(
        `SELECT p.id, p.sku, p.name, p.description, p.price, p.quantity, p.reorder_level,
                c.name AS category, p.created_at
         FROM products p LEFT JOIN categories c ON c.id = p.category_id
         WHERE ${whereSql} AND p.id > $${params.length + 1}
         ORDER BY p.id LIMIT ${BATCH}`,
        [...params, lastId]
      );
      if (!rows.length) break;
      for (const r of rows) csv.write(r);
      lastId = rows[rows.length - 1].id;
    }
  } finally {
    csv.end();
  }
}

module.exports = { streamProductsCsv };