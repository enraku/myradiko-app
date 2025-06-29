const axios = require('axios');
const xml2js = require('xml2js');

async function debugRadikoPrograms() {
    const parser = new xml2js.Parser();
    
    try {
        console.log('Debugging radiko program API response...');
        
        // 昨日の日付で試す
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dateStr = yesterday.getFullYear() + 
            String(yesterday.getMonth() + 1).padStart(2, '0') + 
            String(yesterday.getDate()).padStart(2, '0');
        
        const programUrl = `https://radiko.jp/v3/program/station/date/${dateStr}/TBS.xml`;
        console.log(`Fetching: ${programUrl}`);
        
        const response = await axios.get(programUrl);
        console.log(`Status: ${response.status}`);
        console.log(`Content-Length: ${response.data.length}`);
        console.log('Raw XML response (first 1500 chars):');
        console.log(response.data.substring(0, 1500));
        
        if (response.data.length > 0) {
            console.log('\nParsing XML...');
            const result = await parser.parseStringPromise(response.data);
            
            console.log('\nTop-level structure:');
            console.log('Keys:', Object.keys(result));
            
            if (result.radiko) {
                console.log('\nradiko structure:');
                console.log('Keys:', Object.keys(result.radiko));
                
                if (result.radiko.stations) {
                    console.log('\nstations structure:');
                    console.log('Length:', result.radiko.stations.length);
                    
                    if (result.radiko.stations[0]) {
                        console.log('First stations keys:', Object.keys(result.radiko.stations[0]));
                        
                        if (result.radiko.stations[0].station) {
                            console.log('\nstation structure:');
                            console.log('Length:', result.radiko.stations[0].station.length);
                            
                            if (result.radiko.stations[0].station[0]) {
                                const station = result.radiko.stations[0].station[0];
                                console.log('Station keys:', Object.keys(station));
                                
                                if (station.date) {
                                    console.log('\ndate structure:');
                                    console.log('Length:', station.date.length);
                                    
                                    if (station.date[0]) {
                                        console.log('Date keys:', Object.keys(station.date[0]));
                                        console.log('Date attributes:', station.date[0].$);
                                        
                                        if (station.date[0].prog) {
                                            console.log(`\nFound ${station.date[0].prog.length} programs!`);
                                            console.log('First program structure:');
                                            console.log(JSON.stringify(station.date[0].prog[0], null, 2));
                                        } else {
                                            console.log('\nNo prog array found in date[0]');
                                        }
                                    }
                                } else {
                                    console.log('\nNo date array found in station');
                                }
                            }
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Debug failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data.substring(0, 500));
        }
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    debugRadikoPrograms()
        .then(() => {
            console.log('\nDebug completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error during debug:', error);
            process.exit(1);
        });
}

module.exports = debugRadikoPrograms;