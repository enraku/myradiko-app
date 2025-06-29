const express = require('express');
const router = express.Router();

// Controllers
const stationsController = require('../controllers/stationsController');
const programsController = require('../controllers/programsController');
const reservationsController = require('../controllers/reservationsController');
const recordingsController = require('../controllers/recordingsController');
const schedulerController = require('../controllers/schedulerController');
const settingsController = require('../controllers/settingsController');
const logsController = require('../controllers/logsController');
const downloadController = require('../controllers/downloadController');
const systemController = require('../controllers/systemController');

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'MyRadiko API Server is running',
        timestamp: new Date().toISOString()
    });
});

// Stations routes
router.get('/stations', stationsController.getStations);
router.get('/stations/:areaCode', stationsController.getStationsByArea);

// Programs routes
router.get('/programs/:stationId/date/:date', programsController.getProgramsByDate);
router.get('/programs/:stationId/weekly', programsController.getWeeklyPrograms);
router.get('/programs/:stationId/current', programsController.getCurrentProgram);
router.get('/programs/search', programsController.searchPrograms);

// Reservations routes
router.get('/reservations', reservationsController.getAll);
router.get('/reservations/:id', reservationsController.getById);
router.post('/reservations', reservationsController.create);
router.put('/reservations/:id', reservationsController.update);
router.delete('/reservations/:id', reservationsController.delete);
router.get('/reservations/upcoming/:hours', reservationsController.getUpcoming);

// Recordings routes
const recordingsRoutes = require('./recordings');
router.use('/recordings', recordingsRoutes);

// Scheduler routes
router.get('/scheduler/status', schedulerController.getStatus);
router.post('/scheduler/start', schedulerController.start);
router.post('/scheduler/stop', schedulerController.stop);
router.post('/scheduler/update', schedulerController.updateSchedules);
router.get('/scheduler/active', schedulerController.getActiveRecordings);
router.post('/scheduler/recordings/:recordingId/stop', schedulerController.stopRecording);

// Settings routes
router.get('/settings', settingsController.getAll);
router.get('/settings/:key', settingsController.get);
router.put('/settings/:key', settingsController.set);
router.delete('/settings/:key', settingsController.delete);

// Logs routes
router.get('/logs', logsController.getAll);
router.get('/logs/level/:level', logsController.getByLevel);
router.get('/logs/category/:category', logsController.getByCategory);
router.get('/logs/recent/:days', logsController.getRecent);

// Download routes
router.post('/downloads', downloadController.downloadPastProgram);
router.get('/downloads/active', downloadController.getActiveDownloads);
router.get('/downloads/:downloadId/status', downloadController.getDownloadStatus);
router.post('/downloads/:downloadId/stop', downloadController.stopDownload);

// System routes
router.get('/system/info', systemController.getSystemInfo);
router.post('/system/open-recordings-folder', systemController.openRecordingsFolder);
router.post('/system/open-folder', systemController.openFolder);

module.exports = router;