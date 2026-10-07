const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/stock.service');

exports.change = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.changeStock(req.params.id, req.body) });
});

exports.productHistory = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await service.getHistory(req.params.id, req.query)) });
});

exports.allHistory = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await service.getAllHistory(req.query)) });
});