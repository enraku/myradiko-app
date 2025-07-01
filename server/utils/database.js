const MyRadikoDatabase = require('../models/Database');

// シングルトンインスタンス
let db = null;
let isConnecting = false;

const getDatabase = async () => {
  if (!db && !isConnecting) {
    isConnecting = true;
    try {
      db = new MyRadikoDatabase();
      await db.connect();
      console.log('Database connection established (singleton)');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      db = null;
      throw error;
    } finally {
      isConnecting = false;
    }
  }
  
  // 接続中の場合は待機
  while (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return db;
};

// データベース操作のラッパー関数
const run = async (sql, params = []) => {
  const database = await getDatabase();
  return database.run(sql, params);
};

const get = async (sql, params = []) => {
  const database = await getDatabase();
  return database.get(sql, params);
};

const all = async (sql, params = []) => {
  const database = await getDatabase();
  return database.all(sql, params);
};

module.exports = {
  run,
  get,
  all,
  getDatabase
};