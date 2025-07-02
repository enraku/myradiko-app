const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes and middleware
const apiRoutes = require('./routes/api');
const testRoutes = require('./routes/test');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const initDatabase = require('./utils/initDatabase');
const RecordingScheduler = require('./services/RecordingScheduler');

const app = express();
const PORT = process.env.PORT || 3010;

// Initialize recording scheduler
const recordingScheduler = new RecordingScheduler();

// Electron環境検出
const isElectron = process.versions.electron !== undefined;
console.log('🔍 Environment check:', {
  isElectron,
  nodeVersion: process.version,
  electronVersion: process.versions.electron,
  cwd: process.cwd(),
  platform: process.platform
});

// Initialize database on startup
initDatabase()
  .then(async () => {
    console.log('✅ Database initialized successfully');
    
    // Start recording scheduler after database initialization
    await recordingScheduler.start();
    console.log('✅ Recording scheduler started');
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    if (isElectron) {
      console.log('🔄 Continuing in Electron environment without database...');
      // Electron環境ではprocess.exitを避ける
    } else {
      process.exit(1);
    }
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static files from recordings directory
app.use('/recordings', express.static(path.join(__dirname, '../recordings')));

// API routes
app.use('/api', apiRoutes);

// Test routes for integration testing
app.use('/test', testRoutes);

// Serve Vue.js app for frontend routes
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve Vue.js app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Electron環境での安全なサーバー起動
let server = null;
try {
  server = app.listen(PORT, () => {
    console.log(`🚀 MyRadiko Server is running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🎵 Web app available at http://localhost:${PORT}`);
    console.log('✅ Server startup completed successfully');
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    }
  });
  
} catch (error) {
  console.error('❌ Failed to start server:', error);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  recordingScheduler.stop();
  console.log('Recording scheduler stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  recordingScheduler.stop();
  console.log('Recording scheduler stopped');
  process.exit(0);
});

// Make scheduler available to routes
app.locals.recordingScheduler = recordingScheduler;

module.exports = app;