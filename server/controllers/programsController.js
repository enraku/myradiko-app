const RadikoAPI = require('../utils/RadikoAPI');

const radikoAPI = new RadikoAPI();

const programsController = {
    // 指定日の番組表取得
    async getProgramsByDate(req, res) {
        try {
            const { stationId, date } = req.params;
            
            console.log(`Fetching programs for ${stationId} on ${date}`);
            const programs = await radikoAPI.getProgramsByDate(stationId, date);
            
            res.json({
                success: true,
                data: programs,
                count: programs.length,
                stationId: stationId,
                date: date
            });
        } catch (error) {
            console.error('Failed to fetch programs by date:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch programs by date',
                message: error.message
            });
        }
    },

    // 週間番組表取得
    async getWeeklyPrograms(req, res) {
        try {
            const { stationId } = req.params;
            
            console.log(`Fetching weekly programs for ${stationId}`);
            const programs = await radikoAPI.getWeeklyPrograms(stationId);
            
            res.json({
                success: true,
                data: programs,
                count: programs.length,
                stationId: stationId
            });
        } catch (error) {
            console.error('Failed to fetch weekly programs:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch weekly programs',
                message: error.message
            });
        }
    },

    // 現在放送中の番組取得
    async getCurrentProgram(req, res) {
        try {
            const { stationId } = req.params;
            
            console.log(`Fetching current program for ${stationId}`);
            const program = await radikoAPI.getCurrentProgram(stationId);
            
            res.json({
                success: true,
                data: program,
                stationId: stationId
            });
        } catch (error) {
            console.error('Failed to fetch current program:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch current program',
                message: error.message
            });
        }
    },

    // 番組検索
    async searchPrograms(req, res) {
        try {
            const { q, station, date } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required',
                    message: 'Please provide a search query (q parameter)'
                });
            }

            console.log(`Searching programs with query: ${q}`);
            
            // 基本的な検索実装（実際の実装では、複数日にわたって検索する必要がある）
            const results = [];
            
            if (station && date) {
                const programs = await radikoAPI.getProgramsByDate(station, date);
                const filtered = programs.filter(program => 
                    program.title.toLowerCase().includes(q.toLowerCase()) ||
                    (program.desc && program.desc.toLowerCase().includes(q.toLowerCase())) ||
                    (program.pfm && program.pfm.toLowerCase().includes(q.toLowerCase()))
                );
                results.push(...filtered);
            }
            
            res.json({
                success: true,
                data: results,
                count: results.length,
                query: q,
                station: station,
                date: date
            });
        } catch (error) {
            console.error('Failed to search programs:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to search programs',
                message: error.message
            });
        }
    }
};

module.exports = programsController;