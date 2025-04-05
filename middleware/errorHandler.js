// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server';
  
  // Customize error response based on error type
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Authentication Error',
      error: 'Invalid or expired token'
    });
  }
  
  // Generic error response
  res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.stack
  });
};

module.exports = errorHandler;