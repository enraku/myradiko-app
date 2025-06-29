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

// Initialize database on startup
initDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    
    // Start recording scheduler after database initialization
    recordingScheduler.start();
    console.log('Recording scheduler started');
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
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

app.listen(PORT, () => {
  console.log(`🚀 MyRadiko Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🎵 Web app available at http://localhost:${PORT}`);
});

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