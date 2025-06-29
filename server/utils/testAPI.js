const axios = require('axios');

const BASE_URL = 'http://localhost:3010/api';

async function testAPI() {
    console.log('Testing MyRadiko API endpoints...\n');

    try {
        // 1. Health check
        console.log('1. Testing health check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check:', healthResponse.data.message);

        // 2. Settings API
        console.log('\n2. Testing Settings API...');
        
        // Get all settings
        const settingsResponse = await axios.get(`${BASE_URL}/settings`);
        console.log(`✅ Settings retrieved: ${settingsResponse.data.count} items`);
        
        // Get specific setting
        const recordingPathResponse = await axios.get(`${BASE_URL}/settings/recording_path`);
        console.log(`✅ Recording path: ${recordingPathResponse.data.data.value}`);

        // 3. Stations API
        console.log('\n3. Testing Stations API...');
        
        // Get Tokyo stations
        const stationsResponse = await axios.get(`${BASE_URL}/stations/JP13`);
        console.log(`✅ Tokyo stations: ${stationsResponse.data.count} stations`);
        
        if (stationsResponse.data.data.length > 0) {
            console.log(`   Sample: ${stationsResponse.data.data[0].name} (${stationsResponse.data.data[0].id})`);
        }

        // 4. Programs API
        console.log('\n4. Testing Programs API...');
        
        if (stationsResponse.data.data.length > 0) {
            const testStation = stationsResponse.data.data[0];
            const today = new Date();
            const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');

            try {
                const programsResponse = await axios.get(`${BASE_URL}/programs/${testStation.id}/date/${dateStr}`);
                console.log(`✅ Programs for ${testStation.name}: ${programsResponse.data.count} programs`);
            } catch (error) {
                console.log(`⚠️  Programs API: ${error.response?.status} - Possibly no data for today`);
            }
        }

        // 5. Reservations API
        console.log('\n5. Testing Reservations API...');
        
        // Get all reservations
        const reservationsResponse = await axios.get(`${BASE_URL}/reservations`);
        console.log(`✅ Reservations: ${reservationsResponse.data.count} items`);

        // Create test reservation
        const testReservation = {
            title: 'Test Program',
            station_id: 'TBS',
            station_name: 'TBSラジオ',
            start_time: '2024-01-01 10:00:00',
            end_time: '2024-01-01 11:00:00',
            repeat_type: 'none'
        };

        const createReservationResponse = await axios.post(`${BASE_URL}/reservations`, testReservation);
        console.log(`✅ Reservation created: ID ${createReservationResponse.data.data.id}`);

        // 6. Recordings API
        console.log('\n6. Testing Recordings API...');
        
        const recordingsResponse = await axios.get(`${BASE_URL}/recordings`);
        console.log(`✅ Recordings: ${recordingsResponse.data.count} items`);

        // 7. Logs API
        console.log('\n7. Testing Logs API...');
        
        const logsResponse = await axios.get(`${BASE_URL}/logs?limit=10`);
        console.log(`✅ Logs: ${logsResponse.data.count} items (limited to 10)`);

        console.log('\n✅ All API tests completed successfully!');

    } catch (error) {
        console.error('\n❌ API test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    testAPI()
        .then(() => {
            console.log('API tests completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error during API tests:', error);
            process.exit(1);
        });
}

module.exports = testAPI;