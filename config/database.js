const mysql = require('mysql2/promise');

let inMemoryMode = false;
let mysqlPool = null;

const experiments = [
    {
        id: 1,
        name: '钢样A升温实验',
        material: '45号钢',
        experiment_type: 'heating',
        description: '碳钢相变温度测定',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 2,
        name: '铝合金冷却实验',
        material: '6061铝合金',
        experiment_type: 'cooling',
        description: '铝合金固溶处理冷却曲线',
        created_at: new Date(),
        updated_at: new Date()
    }
];

const dataPoints = [
    { id: 1, experiment_id: 1, time_value: 0, temperature: 25 },
    { id: 2, experiment_id: 1, time_value: 30, temperature: 150 },
    { id: 3, experiment_id: 1, time_value: 60, temperature: 280 },
    { id: 4, experiment_id: 1, time_value: 90, temperature: 410 },
    { id: 5, experiment_id: 1, time_value: 120, temperature: 540 },
    { id: 6, experiment_id: 1, time_value: 150, temperature: 650 },
    { id: 7, experiment_id: 1, time_value: 180, temperature: 700 },
    { id: 8, experiment_id: 1, time_value: 210, temperature: 720 },
    { id: 9, experiment_id: 1, time_value: 240, temperature: 730 },
    { id: 10, experiment_id: 1, time_value: 270, temperature: 735 },
    { id: 11, experiment_id: 1, time_value: 300, temperature: 740 },
    { id: 12, experiment_id: 1, time_value: 330, temperature: 760 },
    { id: 13, experiment_id: 1, time_value: 360, temperature: 800 },
    { id: 14, experiment_id: 1, time_value: 390, temperature: 850 },
    { id: 15, experiment_id: 1, time_value: 420, temperature: 900 },
    { id: 16, experiment_id: 1, time_value: 450, temperature: 950 },
    { id: 17, experiment_id: 1, time_value: 480, temperature: 1000 },
    { id: 18, experiment_id: 2, time_value: 0, temperature: 550 },
    { id: 19, experiment_id: 2, time_value: 30, temperature: 510 },
    { id: 20, experiment_id: 2, time_value: 60, temperature: 470 },
    { id: 21, experiment_id: 2, time_value: 90, temperature: 430 },
    { id: 22, experiment_id: 2, time_value: 120, temperature: 390 },
    { id: 23, experiment_id: 2, time_value: 150, temperature: 350 },
    { id: 24, experiment_id: 2, time_value: 180, temperature: 310 },
    { id: 25, experiment_id: 2, time_value: 210, temperature: 280 },
    { id: 26, experiment_id: 2, time_value: 240, temperature: 260 },
    { id: 27, experiment_id: 2, time_value: 270, temperature: 250 },
    { id: 28, experiment_id: 2, time_value: 300, temperature: 245 },
    { id: 29, experiment_id: 2, time_value: 330, temperature: 240 },
    { id: 30, experiment_id: 2, time_value: 360, temperature: 220 },
    { id: 31, experiment_id: 2, time_value: 390, temperature: 190 },
    { id: 32, experiment_id: 2, time_value: 420, temperature: 150 },
    { id: 33, experiment_id: 2, time_value: 450, temperature: 100 },
    { id: 34, experiment_id: 2, time_value: 480, temperature: 50 },
    { id: 35, experiment_id: 2, time_value: 510, temperature: 25 }
];

let nextExpId = 3;
let nextPointId = 36;

function useInMemory() {
    return inMemoryMode;
}

async function initDatabase() {
    const config = {
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'phase_transition_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    };

    if (process.env.DB_SOCKET_PATH) {
        config.socketPath = process.env.DB_SOCKET_PATH;
    } else {
        config.host = process.env.DB_HOST || 'localhost';
        config.port = process.env.DB_PORT || 3306;
    }

    try {
        mysqlPool = mysql.createPool(config);
        const conn = await mysqlPool.getConnection();
        await conn.ping();
        conn.release();
        console.log('✓ MySQL数据库连接成功');
        return { success: true, pool: mysqlPool };
    } catch (error) {
        console.log(`✗ MySQL连接失败: ${error.message}`);
        console.log('→ 切换到内存模式（演示模式）');
        inMemoryMode = true;
        return { success: false, pool: null };
    }
}

function getPool() {
    return mysqlPool;
}

function getInMemoryPool() {
    return {
        execute: async (sql, params) => {
            if (sql.startsWith('INSERT INTO experiments')) {
                const newExp = {
                    id: nextExpId++,
                    name: params[0],
                    material: params[1],
                    experiment_type: params[2],
                    description: params[3] || '',
                    created_at: new Date(),
                    updated_at: new Date()
                };
                experiments.push(newExp);
                return [{ insertId: newExp.id, affectedRows: 1 }];
            }
            if (sql.startsWith('SELECT * FROM experiments ORDER BY')) {
                return [experiments.slice().sort((a, b) => b.created_at - a.created_at)];
            }
            if (sql.startsWith('SELECT * FROM experiments WHERE id =')) {
                const id = parseInt(params[0]);
                const exp = experiments.find(e => e.id === id);
                return [exp ? [exp] : []];
            }
            if (sql.startsWith('UPDATE experiments SET')) {
                const id = parseInt(params[4]);
                const idx = experiments.findIndex(e => e.id === id);
                if (idx >= 0) {
                    experiments[idx] = {
                        ...experiments[idx],
                        name: params[0],
                        material: params[1],
                        experiment_type: params[2],
                        description: params[3] || '',
                        updated_at: new Date()
                    };
                    return [{ affectedRows: 1 }];
                }
                return [{ affectedRows: 0 }];
            }
            if (sql.startsWith('DELETE FROM experiments WHERE id =')) {
                const id = parseInt(params[0]);
                const idx = experiments.findIndex(e => e.id === id);
                if (idx >= 0) {
                    experiments.splice(idx, 1);
                    for (let i = dataPoints.length - 1; i >= 0; i--) {
                        if (dataPoints[i].experiment_id === id) {
                            dataPoints.splice(i, 1);
                        }
                    }
                    return [{ affectedRows: 1 }];
                }
                return [{ affectedRows: 0 }];
            }
            if (sql.startsWith('INSERT INTO data_points')) {
                const points = [];
                for (let i = 0; i < params.length; i += 3) {
                    points.push({
                        id: nextPointId++,
                        experiment_id: parseInt(params[i]),
                        time_value: parseFloat(params[i + 1]),
                        temperature: parseFloat(params[i + 2]),
                        created_at: new Date()
                    });
                }
                dataPoints.push(...points);
                return [{ affectedRows: points.length }];
            }
            if (sql.startsWith('SELECT * FROM data_points WHERE experiment_id =')) {
                const expId = parseInt(params[0]);
                const points = dataPoints
                    .filter(p => p.experiment_id === expId)
                    .sort((a, b) => a.time_value - b.time_value);
                return [points];
            }
            if (sql.startsWith('SELECT time_value, temperature FROM data_points WHERE experiment_id =')) {
                const expId = parseInt(params[0]);
                const points = dataPoints
                    .filter(p => p.experiment_id === expId)
                    .sort((a, b) => a.time_value - b.time_value)
                    .map(p => ({ time_value: p.time_value, temperature: p.temperature }));
                return [points];
            }
            return [[]];
        },
        getConnection: async () => {
            return {
                execute: async (sql, params) => {
                    const [rows] = await getInMemoryPool().execute(sql, params);
                    return [rows];
                },
                release: () => {}
            };
        }
    };
}

function getAllData() {
    return { experiments, dataPoints };
}

module.exports = {
    initDatabase,
    getPool,
    getInMemoryPool,
    useInMemory,
    getAllData
};
