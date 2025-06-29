const RadikoAPI = require('./RadikoAPI');

async function testRadikoAPI() {
    console.log('Testing radiko API...');
    const api = new RadikoAPI();

    try {
        // 1. 東京地域の放送局一覧取得テスト
        console.log('\n1. Testing getStations (Tokyo area - JP13)...');
        const stations = await api.getStations('JP13');
        console.log(`Found ${stations.length} stations in Tokyo area`);
        
        if (stations.length > 0) {
            console.log('Sample stations:');
            stations.slice(0, 3).forEach((station, index) => {
                console.log(`  ${index + 1}. ${station.name} (${station.id})`);
            });
        }

        // 2. 特定局での番組表取得テスト（今日の日付で）
        if (stations.length > 0) {
            const testStation = stations.find(s => s.id === 'TBS') || stations[0];
            const today = new Date();
            const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');

            console.log(`\n2. Testing getProgramsByDate for ${testStation.name} (${testStation.id}) on ${dateStr}...`);
            const programs = await api.getProgramsByDate(testStation.id, dateStr);
            console.log(`Found ${programs.length} programs for today`);
            
            if (programs.length > 0) {
                console.log('Sample programs:');
                programs.slice(0, 3).forEach((program, index) => {
                    const startTime = new Date(program.start_time).toLocaleTimeString('ja-JP');
                    const endTime = new Date(program.end_time).toLocaleTimeString('ja-JP');
                    console.log(`  ${index + 1}. ${startTime}-${endTime}: ${program.title}`);
                });
            }

            // 3. 現在放送中の番組取得テスト
            console.log(`\n3. Testing getCurrentProgram for ${testStation.name}...`);
            const currentProgram = await api.getCurrentProgram(testStation.id);
            
            if (currentProgram) {
                const startTime = new Date(currentProgram.start_time).toLocaleTimeString('ja-JP');
                const endTime = new Date(currentProgram.end_time).toLocaleTimeString('ja-JP');
                console.log(`Current program: ${startTime}-${endTime}: ${currentProgram.title}`);
                if (currentProgram.desc) {
                    console.log(`Description: ${currentProgram.desc.substring(0, 100)}...`);
                }
            } else {
                console.log('No current program found or error occurred');
            }

            // 4. 週間番組表取得テスト（少量のデータのみ確認）
            console.log(`\n4. Testing getWeeklyPrograms for ${testStation.name} (limited data)...`);
            const weeklyPrograms = await api.getWeeklyPrograms(testStation.id);
            console.log(`Found ${weeklyPrograms.length} programs for the week`);
            
            if (weeklyPrograms.length > 0) {
                // 今日のプログラムのみを表示
                const todayPrograms = weeklyPrograms.filter(p => p.date === dateStr);
                console.log(`Today's programs: ${todayPrograms.length}`);
                
                if (todayPrograms.length > 0) {
                    console.log('Sample from today:');
                    todayPrograms.slice(0, 2).forEach((program, index) => {
                        const startTime = new Date(program.start_time).toLocaleTimeString('ja-JP');
                        console.log(`  ${index + 1}. ${startTime}: ${program.title}`);
                    });
                }
            }
        }

        console.log('\n✅ All radiko API tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ radiko API test failed:', error.message);
        console.error('Full error:', error);
        throw error;
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    testRadikoAPI()
        .then(() => {
            console.log('radiko API tests completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error during radiko API tests:', error);
            process.exit(1);
        });
}

module.exports = testRadikoAPI;