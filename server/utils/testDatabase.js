const Settings = require('../models/Settings');
const Reservations = require('../models/Reservations');
const RecordingHistory = require('../models/RecordingHistory');
const Logs = require('../models/Logs');

async function testDatabase() {
    console.log('Testing database models...');

    try {
        // Settings test
        console.log('\n1. Testing Settings model...');
        const settings = new Settings();
        
        await settings.set('test_key', 'test_value');
        const value = await settings.get('test_key');
        console.log('Settings test - Set/Get:', value === 'test_value' ? 'PASS' : 'FAIL');
        
        const allSettings = await settings.getAll();
        console.log('Settings test - GetAll:', allSettings.length > 0 ? 'PASS' : 'FAIL');

        // Reservations test
        console.log('\n2. Testing Reservations model...');
        const reservations = new Reservations();
        
        const testReservation = {
            title: 'Test Program',
            station_id: 'TBS',
            station_name: 'TBSラジオ',
            start_time: '2024-01-01 10:00:00',
            end_time: '2024-01-01 11:00:00',
            repeat_type: 'none'
        };
        
        const createResult = await reservations.create(testReservation);
        console.log('Reservations test - Create:', createResult.id > 0 ? 'PASS' : 'FAIL');
        
        const getResult = await reservations.getById(createResult.id);
        console.log('Reservations test - GetById:', getResult ? 'PASS' : 'FAIL');

        // Recording History test
        console.log('\n3. Testing RecordingHistory model...');
        const recordingHistory = new RecordingHistory();
        
        const testRecording = {
            reservation_id: createResult.id,
            title: 'Test Recording',
            station_id: 'TBS',
            station_name: 'TBSラジオ',
            start_time: '2024-01-01 10:00:00',
            end_time: '2024-01-01 11:00:00',
            file_path: '/path/to/test.mp3',
            status: 'completed'
        };
        
        const recordingResult = await recordingHistory.create(testRecording);
        console.log('RecordingHistory test - Create:', recordingResult.id > 0 ? 'PASS' : 'FAIL');

        // Logs test
        console.log('\n4. Testing Logs model...');
        const logs = new Logs();
        
        await logs.info('test', 'Test info message');
        await logs.warning('test', 'Test warning message');
        await logs.error('test', 'Test error message');
        
        const logResults = await logs.getAll(10);
        console.log('Logs test - Create and GetAll:', logResults.length >= 3 ? 'PASS' : 'FAIL');

        console.log('\n✅ All database tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Database test failed:', error);
        throw error;
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    testDatabase()
        .then(() => {
            console.log('Database tests completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error during database tests:', error);
            process.exit(1);
        });
}

module.exports = testDatabase;