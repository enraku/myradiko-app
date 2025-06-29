const axios = require('axios');
const xml2js = require('xml2js');
const { parseRadikoTime, radikoTimeToISO, isTimeInRange } = require('./dateUtils');

class RadikoAPI {
    constructor() {
        this.baseURL = 'https://radiko.jp/v3';
        this.parser = new xml2js.Parser();
    }

    /**
     * 放送局一覧を取得
     * @param {string} areaCode 地域コード (例: JP13)
     * @returns {Promise<Array>} 放送局リスト
     */
    async getStations(areaCode = 'JP13') {
        try {
            const url = `${this.baseURL}/station/list/${areaCode}.xml`;
            console.log(`Fetching stations from: ${url}`);
            
            const response = await axios.get(url);
            const result = await this.parser.parseStringPromise(response.data);
            
            if (result.stations && result.stations.station) {
                return result.stations.station.map(station => ({
                    id: station.id ? station.id[0] : '',
                    name: station.name ? station.name[0] : '',
                    ascii_name: station.ascii_name ? station.ascii_name[0] : '',
                    href: station.href ? station.href[0] : '',
                    ruby: station.ruby ? station.ruby[0] : '',
                    areafree: station.areafree ? station.areafree[0] : '',
                    timefree: station.timefree ? station.timefree[0] : '',
                    logo_urls: station.logo ? station.logo.map(logo => logo._) : []
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching stations:', error.message);
            throw error;
        }
    }

    /**
     * 全放送局一覧を取得
     * @returns {Promise<Array>} 全放送局リスト
     */
    async getAllStations() {
        try {
            const url = `${this.baseURL}/station/region/full.xml`;
            console.log(`Fetching all stations from: ${url}`);
            
            const response = await axios.get(url);
            const result = await this.parser.parseStringPromise(response.data);
            
            const stations = [];
            
            if (result.region_full && result.region_full.region) {
                result.region_full.region.forEach(region => {
                    if (region.station) {
                        region.station.forEach(station => {
                            stations.push({
                                id: station.id ? station.id[0] : '',
                                name: station.name ? station.name[0] : '',
                                area_id: region.$.area_id,
                                region_name: region.$.region_name,
                                ascii_name: station.ascii_name ? station.ascii_name[0] : '',
                                href: station.href ? station.href[0] : '',
                                ruby: station.ruby ? station.ruby[0] : '',
                                areafree: station.areafree ? station.areafree[0] : '',
                                timefree: station.timefree ? station.timefree[0] : '',
                                logo_urls: station.logo ? station.logo.map(logo => logo._) : []
                            });
                        });
                    }
                });
            }
            
            return stations;
        } catch (error) {
            console.error('Error fetching all stations:', error.message);
            throw error;
        }
    }

    /**
     * 指定日の番組表を取得
     * @param {string} stationId 放送局ID
     * @param {string} date 日付 (YYYYMMDD形式)
     * @returns {Promise<Array>} 番組リスト
     */
    async getProgramsByDate(stationId, date) {
        try {
            const url = `${this.baseURL}/program/station/date/${date}/${stationId}.xml`;
            console.log(`Fetching programs from: ${url}`);
            
            const response = await axios.get(url);
            const result = await this.parser.parseStringPromise(response.data);
            
            const programs = [];
            
            if (result.radiko && result.radiko.stations && result.radiko.stations[0].station) {
                const station = result.radiko.stations[0].station[0];
                
                if (station.progs && station.progs[0] && station.progs[0].prog) {
                    station.progs[0].prog.forEach(prog => {
                        programs.push({
                            id: prog.$.id,
                            title: prog.title ? prog.title[0] : '',
                            sub_title: prog.sub_title ? prog.sub_title[0] : '',
                            desc: prog.desc ? prog.desc[0] : '',
                            info: prog.info ? prog.info[0] : '',
                            pfm: prog.pfm ? prog.pfm[0] : '',
                            url: prog.url ? prog.url[0] : '',
                            start_time: prog.$.ft,
                            end_time: prog.$.to,
                            start_time_iso: radikoTimeToISO(prog.$.ft),
                            end_time_iso: radikoTimeToISO(prog.$.to),
                            duration: prog.$.dur,
                            station_id: stationId,
                            date: date
                        });
                    });
                }
            }
            
            return programs;
        } catch (error) {
            console.error(`Error fetching programs for ${stationId} on ${date}:`, error.message);
            throw error;
        }
    }

    /**
     * 指定局の週間番組表を取得
     * @param {string} stationId 放送局ID
     * @returns {Promise<Array>} 番組リスト（1週間分）
     */
    async getWeeklyPrograms(stationId) {
        try {
            const url = `${this.baseURL}/program/station/weekly/${stationId}.xml`;
            console.log(`Fetching weekly programs from: ${url}`);
            
            const response = await axios.get(url);
            const result = await this.parser.parseStringPromise(response.data);
            
            const programs = [];
            
            if (result.radiko && result.radiko.stations && result.radiko.stations[0].station) {
                const station = result.radiko.stations[0].station[0];
                
                if (station.progs) {
                    station.progs.forEach(progsEntry => {
                        const date = progsEntry.date ? progsEntry.date[0] : '';
                        
                        if (progsEntry.prog) {
                            progsEntry.prog.forEach(prog => {
                                programs.push({
                                    id: prog.$.id,
                                    title: prog.title ? prog.title[0] : '',
                                    sub_title: prog.sub_title ? prog.sub_title[0] : '',
                                    desc: prog.desc ? prog.desc[0] : '',
                                    info: prog.info ? prog.info[0] : '',
                                    pfm: prog.pfm ? prog.pfm[0] : '',
                                    url: prog.url ? prog.url[0] : '',
                                    start_time: prog.$.ft,
                                    end_time: prog.$.to,
                                    start_time_iso: radikoTimeToISO(prog.$.ft),
                                    end_time_iso: radikoTimeToISO(prog.$.to),
                                    duration: prog.$.dur,
                                    station_id: stationId,
                                    date: date
                                });
                            });
                        }
                    });
                }
            }
            
            return programs;
        } catch (error) {
            console.error(`Error fetching weekly programs for ${stationId}:`, error.message);
            throw error;
        }
    }

    /**
     * 現在放送中の番組を取得
     * @param {string} stationId 放送局ID
     * @returns {Promise<Object|null>} 現在の番組情報
     */
    async getCurrentProgram(stationId) {
        try {
            const today = new Date();
            const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');
            
            const programs = await this.getProgramsByDate(stationId, dateStr);
            const now = new Date();
            
            for (const program of programs) {
                if (isTimeInRange(program.start_time, program.end_time, now)) {
                    return program;
                }
            }
            
            return null;
        } catch (error) {
            console.error(`Error fetching current program for ${stationId}:`, error.message);
            throw error;
        }
    }
}

module.exports = RadikoAPI;