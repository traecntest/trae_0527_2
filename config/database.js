const mysql = require('mysql2/promise');

const config = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'phase_transition_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

if (process.env.DB_SOCKET_PATH) {
    config.socketPath = process.env.DB_SOCKET_PATH;
} else {
    config.host = process.env.DB_HOST || 'localhost';
    config.port = process.env.DB_PORT || 3306;
}

const pool = mysql.createPool(config);

async function testConnection(retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            console.log('数据库连接成功');
            return true;
        } catch (error) {
            console.error(`数据库连接尝试 ${i + 1}/${retries} 失败: ${error.message}`);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('无法连接到数据库，请检查数据库配置');
                return false;
            }
        }
    }
    return false;
}

module.exports = { pool, testConnection };
