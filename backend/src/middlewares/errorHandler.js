const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  if (err.code === '23505') err = new AppError('Duplicate value (unique rule)', 409, err.detail);
  else if (err.code === '23503') err = new AppError('Related record missing or in use', 409, err.detail);
  else if (err.code === '23514') err = new AppError('Value violates a data rule', 400, err.detail);
  else if (err.name === 'MulterError') err = new AppError(err.message, 400);

  const status = err.status || 500;
  if (status === 500) console.error(err);

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
    details: err.details || undefined,
  });
}

module.exports = { notFound, errorHandler };