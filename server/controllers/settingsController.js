const Settings = require('../models/Settings');

const settings = new Settings();

const settingsController = {
    // 全設定取得
    async getAll(req, res) {
        try {
            console.log('Fetching all settings');
            const data = await settings.getAll();
            
            // 設定をキー・値のオブジェクト形式に変換
            const settingsObj = {};
            data.forEach(setting => {
                settingsObj[setting.key] = {
                    value: setting.value,
                    description: setting.description,
                    updated_at: setting.updated_at
                };
            });
            
            res.json({
                success: true,
                data: settingsObj,
                count: data.length
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch settings',
                message: error.message
            });
        }
    },

    // 特定設定取得
    async get(req, res) {
        try {
            const { key } = req.params;
            
            console.log(`Fetching setting: ${key}`);
            const value = await settings.get(key);
            
            if (value === null) {
                return res.status(404).json({
                    success: false,
                    error: 'Setting not found',
                    message: `Setting with key '${key}' does not exist`
                });
            }
            
            res.json({
                success: true,
                data: {
                    key: key,
                    value: value
                }
            });
        } catch (error) {
            console.error('Failed to fetch setting:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch setting',
                message: error.message
            });
        }
    },

    // 設定更新
    async set(req, res) {
        try {
            const { key } = req.params;
            const { value } = req.body;
            
            if (value === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Value is required',
                    message: 'Please provide a value for the setting'
                });
            }
            
            console.log(`Setting value: ${key} = ${value}`);
            await settings.set(key, value);
            
            res.json({
                success: true,
                message: 'Setting updated successfully',
                data: {
                    key: key,
                    value: value
                }
            });
        } catch (error) {
            console.error('Failed to set setting:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to set setting',
                message: error.message
            });
        }
    },

    // 設定削除
    async delete(req, res) {
        try {
            const { key } = req.params;
            
            console.log(`Deleting setting: ${key}`);
            const result = await settings.delete(key);
            
            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Setting not found',
                    message: `Setting with key '${key}' does not exist`
                });
            }
            
            res.json({
                success: true,
                message: 'Setting deleted successfully'
            });
        } catch (error) {
            console.error('Failed to delete setting:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to delete setting',
                message: error.message
            });
        }
    }
};

module.exports = settingsController;