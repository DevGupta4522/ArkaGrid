export const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] ERROR: ${err.message}`);
  console.error('Stack:', err.stack);

  const networkErrorCodes = new Set(['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH', 'ECONNRESET']);
  const aggregateCode = err?.errors?.find?.(inner => inner?.code)?.code;
  const effectiveCode = err?.code || aggregateCode;
  const errorMessage = String(err?.message || '').toLowerCase();
  const isNetworkTimeout =
    networkErrorCodes.has(effectiveCode) ||
    errorMessage.includes('connection timeout') ||
    errorMessage.includes('timeout expired') ||
    errorMessage.includes('connect etimedout');

  // Handle validation errors
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.array()
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference',
      code: 'INVALID_REFERENCE'
    });
  }

  if (isNetworkTimeout) {
    return res.status(503).json({
      success: false,
      message: 'Database is unavailable. Check DATABASE_URL and confirm PostgreSQL is reachable.',
      code: 'DB_UNAVAILABLE'
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    code: effectiveCode || 'SERVER_ERROR'
  });
};
