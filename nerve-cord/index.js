// Entry point for Railway deployment
// Redirects to server.js with error handling and logging

// Force stdout to be unbuffered for Railway logs
process.stdout.write('Starting Nerve Cord server...\n');
process.stdout.write(`PORT: ${process.env.PORT || '9999'}\n`);
process.stdout.write(`NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

try {
  require('./server.js');
  process.stdout.write('Server module loaded successfully\n');
} catch (error) {
  process.stderr.write(`Failed to start server: ${error}\n`);
  process.exit(1);
}

