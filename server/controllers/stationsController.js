const RadikoAPI = require('../utils/RadikoAPI');

const radikoAPI = new RadikoAPI();

const stationsController = {
    // 全放送局一覧取得
    async getStations(req, res) {
        try {
            console.log('Fetching all stations');
            const stations = await radikoAPI.getAllStations();
            
            res.json({
                success: true,
                data: stations,
                count: stations.length
            });
        } catch (error) {
            console.error('Failed to fetch stations:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch stations',
                message: error.message
            });
        }
    },

    // 地域別放送局一覧取得
    async getStationsByArea(req, res) {
        try {
            const { areaCode } = req.params;
            
            console.log(`Fetching stations for area: ${areaCode}`);
            const stations = await radikoAPI.getStations(areaCode);
            
            res.json({
                success: true,
                data: stations,
                count: stations.length,
                areaCode: areaCode
            });
        } catch (error) {
            console.error('Failed to fetch stations by area:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch stations by area',
                message: error.message
            });
        }
    }
};

module.exports = stationsController;