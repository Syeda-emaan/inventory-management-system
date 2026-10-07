const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getPagination, paginated } = require('../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const search = `%${req.query.search || ''}%`;
  const where = '(name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)';
  const total = (await query(`SELECT COUNT(*)::int AS n FROM suppliers WHERE ${where}`, [search])).rows[0].n;
  const { rows } = await query(
    `SELECT * FROM suppliers WHERE ${where} ORDER BY name LIMIT $2 OFFSET $3`,
    [search, limit, offset]
  );
  res.json({ success: true, ...paginated(rows, total, page, limit) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
  if (!rows.length) throw new AppError('Supplier not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email = null, phone = null, address = null } = req.body;
  const { rows } = await query(
    'INSERT INTO suppliers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, email, phone, address]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const keys = Object.keys(req.body);
  if (!keys.length) throw new AppError('Nothing to update', 400);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `UPDATE suppliers SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    [...keys.map((k) => req.body[k]), req.params.id]
  );
  if (!rows.length) throw new AppError('Supplier not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
  if (!rowCount) throw new AppError('Supplier not found', 404);
  res.json({ success: true, message: 'Supplier deleted' });
});