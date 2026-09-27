/**
 * Global error handling middleware.
 * Must be registered AFTER all routes with 4 params (err, req, res, next).
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] ${status} - ${message}`, {
    method: req.method,
    url: req.originalUrl,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Don't send response if headers already flushed (SSE streams)
  if (res.headersSent) return next(err);

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler — catches undefined routes.
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
