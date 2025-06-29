const axios = require('axios');
const xml2js = require('xml2js');

async function debugRadikoAPI() {
    const parser = new xml2js.Parser();
    
    try {
        console.log('Debugging radiko API response structure...');
        
        // 1. 放送局一覧のレスポンス構造を確認
        console.log('\n=== Station List API Response ===');
        const stationUrl = 'https://radiko.jp/v3/station/list/JP13.xml';
        console.log(`Fetching: ${stationUrl}`);
        
        const stationResponse = await axios.get(stationUrl);
        console.log('Raw XML response (first 500 chars):');
        console.log(stationResponse.data.substring(0, 500));
        
        const stationResult = await parser.parseStringPromise(stationResponse.data);
        console.log('\nParsed JSON structure:');
        console.log(JSON.stringify(stationResult, null, 2));
        
        // 2. 番組表のレスポンス構造を確認（TBSラジオ、今日の日付）
        const today = new Date();
        const dateStr = today.getFullYear() + 
            String(today.getMonth() + 1).padStart(2, '0') + 
            String(today.getDate()).padStart(2, '0');
        
        console.log('\n=== Program Guide API Response ===');
        const programUrl = `https://radiko.jp/v3/program/station/date/${dateStr}/TBS.xml`;
        console.log(`Fetching: ${programUrl}`);
        
        try {
            const programResponse = await axios.get(programUrl);
            console.log('Raw XML response (first 1000 chars):');
            console.log(programResponse.data.substring(0, 1000));
            
            const programResult = await parser.parseStringPromise(programResponse.data);
            console.log('\nParsed JSON structure (limited):');
            
            // 構造を確認するために一部だけ表示
            if (programResult.radiko) {
                console.log('radiko structure exists');
                if (programResult.radiko.stations) {
                    console.log('stations structure exists');
                    if (programResult.radiko.stations[0] && programResult.radiko.stations[0].station) {
                        console.log('station structure exists');
                        const station = programResult.radiko.stations[0].station[0];
                        if (station.date && station.date[0] && station.date[0].prog) {
                            console.log(`Found ${station.date[0].prog.length} programs`);
                            console.log('First program structure:');
                            console.log(JSON.stringify(station.date[0].prog[0], null, 2));
                        }
                    }
                }
            }
        } catch (programError) {
            console.log('Program API Error:', programError.message);
        }
        
    } catch (error) {
        console.error('Debug failed:', error.message);
        console.error('Full error:', error);
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    debugRadikoAPI()
        .then(() => {
            console.log('\nDebug completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error during debug:', error);
            process.exit(1);
        });
}

module.exports = debugRadikoAPI;