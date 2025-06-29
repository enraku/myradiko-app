const express = require('express');
const router = express.Router();
const TestData = require('../utils/TestData');

// テスト用放送局データ提供
router.get('/stations', (req, res) => {
    res.json({
        success: true,
        data: TestData.getTestStations(),
        count: TestData.getTestStations().length
    });
});

// テスト用番組データ提供
router.get('/programs/:stationId/:date', (req, res) => {
    const { stationId, date } = req.params;
    const programs = TestData.getTestPrograms(stationId, date);
    
    res.json({
        success: true,
        data: programs,
        count: programs.length,
        station_id: stationId,
        date: date
    });
});

// テスト用予約データ提供
router.get('/reservations', (req, res) => {
    res.json({
        success: true,
        reservations: TestData.getTestReservations(),
        count: TestData.getTestReservations().length
    });
});

// テスト用録音ファイルデータ提供
router.get('/recordings', (req, res) => {
    res.json({
        success: true,
        recordings: TestData.getTestRecordings(),
        count: TestData.getTestRecordings().length
    });
});

// テスト接続確認
router.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'Test API is working',
        timestamp: new Date().toISOString()
    });
});

// テストデータ初期化（データベースにテストデータを挿入）
router.post('/init', async (req, res) => {
    try {
        // テスト用予約データをデータベースに挿入
        const Database = require('../models/Database');
        const db = new Database();
        
        // テストデータをDBに挿入
        const testReservations = TestData.getTestReservations();
        
        for (const reservation of testReservations) {
            await db.run(`
                INSERT OR REPLACE INTO reservations 
                (title, station_id, station_name, start_time, end_time, repeat_type, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                reservation.title,
                reservation.station_id,
                reservation.station_name,
                reservation.start_time,
                reservation.end_time,
                reservation.repeat_type,
                reservation.status,
                reservation.created_at,
                reservation.updated_at
            ]);
        }
        
        res.json({
            success: true,
            message: 'Test data initialized',
            inserted: testReservations.length
        });
    } catch (error) {
        console.error('Failed to initialize test data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize test data',
            message: error.message
        });
    }
});

module.exports = router;