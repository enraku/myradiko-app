const RadikoAPI = require('./RadikoAPI');

async function testRadikoWithDates() {
    console.log('Testing radiko API with different dates...');
    const api = new RadikoAPI();

    try {
        // 1. 放送局取得
        console.log('\n1. Getting Tokyo stations...');
        const stations = await api.getStations('JP13');
        console.log(`Found ${stations.length} stations`);
        
        if (stations.length === 0) {
            throw new Error('No stations found');
        }

        const testStation = stations.find(s => s.id === 'TBS') || stations[0];
        console.log(`Using station: ${testStation.name} (${testStation.id})`);

        // 2. 複数の日付でテスト
        const dates = [
            // 今日
            new Date(),
            // 昨日
            new Date(Date.now() - 24 * 60 * 60 * 1000),
            // 一昨日
            new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            // 3日前
            new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        ];

        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            const dateStr = date.getFullYear() + 
                String(date.getMonth() + 1).padStart(2, '0') + 
                String(date.getDate()).padStart(2, '0');

            console.log(`\n${i + 2}. Testing date: ${dateStr} (${i === 0 ? 'today' : i + ' days ago'})`);
            
            try {
                const programs = await api.getProgramsByDate(testStation.id, dateStr);
                console.log(`   ✅ Found ${programs.length} programs`);
                
                if (programs.length > 0) {
                    console.log('   Sample programs:');
                    programs.slice(0, 3).forEach((program, index) => {
                        const startTime = new Date(program.start_time.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
                        console.log(`     ${index + 1}. ${startTime.toLocaleString('ja-JP')}: ${program.title}`);
                    });
                    
                    // 最初に見つかったデータで詳細テスト
                    if (i === 0 || programs.length > 0) {
                        console.log('\n   Testing weekly programs...');
                        try {
                            const weeklyPrograms = await api.getWeeklyPrograms(testStation.id);
                            console.log(`   ✅ Weekly programs: ${weeklyPrograms.length} found`);
                            
                            if (weeklyPrograms.length > 0) {
                                // 日付別集計
                                const programsByDate = {};
                                weeklyPrograms.forEach(program => {
                                    if (!programsByDate[program.date]) {
                                        programsByDate[program.date] = 0;
                                    }
                                    programsByDate[program.date]++;
                                });
                                
                                console.log('   Programs by date:');
                                Object.keys(programsByDate).sort().forEach(date => {
                                    console.log(`     ${date}: ${programsByDate[date]} programs`);
                                });
                            }
                        } catch (weeklyError) {
                            console.log(`   ⚠️  Weekly programs failed: ${weeklyError.message}`);
                        }
                        break; // 成功したら終了
                    }
                }
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
            }
        }

        console.log('\n✅ Date testing completed');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        throw error;
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    testRadikoWithDates()
        .then(() => {
            console.log('Date testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error during date testing:', error);
            process.exit(1);
        });
}

module.exports = testRadikoWithDates;