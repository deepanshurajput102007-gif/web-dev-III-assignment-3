function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid product ID';
  }
  if (err.code === 11000) {
    statusCode = 409;
    message = `A product with this ${Object.keys(err.keyValue || {})[0] || 'value'} already exists`;
  }
  res.status(statusCode).json({ message });
}

module.exports = { notFound, errorHandler };
