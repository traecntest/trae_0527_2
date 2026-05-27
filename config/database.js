const mysql = require('mysql2/promise');

const config = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'phase_transition_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DB_SOCKET_PATH) {
    config.socketPath = process.env.DB_SOCKET_PATH;
} else {
    config.host = process.env.DB_HOST || 'localhost';
    config.port = process.env.DB_PORT || 3306;
}

const pool = mysql.createPool(config);

module.exports = pool;
