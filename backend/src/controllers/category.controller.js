const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getPagination, paginated } = require('../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const search = `%${req.query.search || ''}%`;
  const total = (await query('SELECT COUNT(*)::int AS n FROM categories WHERE name ILIKE $1', [search])).rows[0].n;
  const { rows } = await query(
    `SELECT c.*,
       (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) AS product_count
     FROM categories c WHERE c.name ILIKE $1
     ORDER BY c.name LIMIT $2 OFFSET $3`,
    [search, limit, offset]
  );
  res.json({ success: true, ...paginated(rows, total, page, limit) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  if (!rows.length) throw new AppError('Category not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, parent_id = null } = req.body;
  const { rows } = await query('INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING *', [name, parent_id]);
  res.status(201).json({ success: true, data: rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const keys = Object.keys(req.body);
  if (!keys.length) throw new AppError('Nothing to update', 400);
  if (req.body.parent_id && Number(req.body.parent_id) === Number(req.params.id))
    throw new AppError('A category cannot be its own parent', 400);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `UPDATE categories SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    [...keys.map((k) => req.body[k]), req.params.id]
  );
  if (!rows.length) throw new AppError('Category not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  if (!rowCount) throw new AppError('Category not found', 404);
  res.json({ success: true, message: 'Category deleted' });
});