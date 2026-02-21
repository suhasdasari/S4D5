// Entry point for Railway deployment
// Redirects to server.js with error handling and logging

console.log('Starting Nerve Cord server...');
console.log('PORT:', process.env.PORT || '9999');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

try {
  require('./server.js');
  console.log('Server module loaded successfully');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

