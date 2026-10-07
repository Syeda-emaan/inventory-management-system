const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/product.service');
const exportService = require('../services/export.service');

exports.list = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await service.list(req.query)) });
});

exports.getOne = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getById(req.params.id) });
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req.body) });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.update(req.params.id, req.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ success: true, message: 'Product deleted' });
});

exports.exportCsv = asyncHandler(async (req, res) => {
  await exportService.streamProductsCsv(req.query, res);
});