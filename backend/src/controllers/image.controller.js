const fs = require('fs');
const path = require('path');
const { query, withTransaction } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const removeFile = (filePath) => {
  fs.unlink(path.join(__dirname, '..', '..', filePath), () => {});
};

exports.upload = asyncHandler(async (req, res) => {
  const files = req.files || [];
  try {
    if (!files.length) throw new AppError('No image uploaded (field name: images)', 400);

    const exists = await query('SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (!exists.rowCount) throw new AppError('Product not found', 404);

    const saved = await withTransaction(async (client) => {
      const has = await client.query('SELECT 1 FROM product_images WHERE product_id = $1 LIMIT 1', [req.params.id]);
      let makePrimary = !has.rowCount; // pehli image primary
      const out = [];
      for (const f of files) {
        const filePath = `uploads/products/${f.filename}`;
        const r = await client.query(
          'INSERT INTO product_images (product_id, file_path, is_primary) VALUES ($1,$2,$3) RETURNING *',
          [req.params.id, filePath, makePrimary]
        );
        makePrimary = false;
        out.push(r.rows[0]);
      }
      return out;
    });
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    files.forEach((f) => removeFile(`uploads/products/${f.filename}`)); // fail hone par files saaf
    throw err;
  }
});

exports.setPrimary = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  await withTransaction(async (client) => {
    const r = await client.query('SELECT 1 FROM product_images WHERE id = $1 AND product_id = $2', [imageId, id]);
    if (!r.rowCount) throw new AppError('Image not found', 404);
    await client.query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [id]);
    await client.query('UPDATE product_images SET is_primary = true WHERE id = $1', [imageId]);
  });
  res.json({ success: true, message: 'Primary image updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  const { rows } = await query(
    'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING *', [imageId, id]
  );
  if (!rows.length) throw new AppError('Image not found', 404);
  removeFile(rows[0].file_path);

  if (rows[0].is_primary) {
    await query(
      `UPDATE product_images SET is_primary = true
       WHERE id = (SELECT id FROM product_images WHERE product_id = $1 ORDER BY id LIMIT 1)`, [id]
    );
  }
  res.json({ success: true, message: 'Image deleted' });
});