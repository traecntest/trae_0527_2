const { pool } = require('../config/database');
const { calculatePhaseTransition } = require('../utils/phaseTransitionCalculator');

const experimentController = {
    async createExperiment(req, res) {
        try {
            const { name, material, experiment_type, description } = req.body;
            
            if (!name || !material || !experiment_type) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数：name, material, experiment_type'
                });
            }
            
            const [result] = await pool.execute(
                'INSERT INTO experiments (name, material, experiment_type, description) VALUES (?, ?, ?, ?)',
                [name, material, experiment_type, description || '']
            );
            
            res.status(201).json({
                success: true,
                data: {
                    id: result.insertId,
                    name,
                    material,
                    experiment_type,
                    description
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async getExperiments(req, res) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM experiments ORDER BY created_at DESC'
            );
            
            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async getExperimentById(req, res) {
        try {
            const { id } = req.params;
            const [rows] = await pool.execute(
                'SELECT * FROM experiments WHERE id = ?',
                [id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: '实验不存在'
                });
            }
            
            res.json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async updateExperiment(req, res) {
        try {
            const { id } = req.params;
            const { name, material, experiment_type, description } = req.body;
            
            if (!name || !material || !experiment_type) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数：name, material, experiment_type'
                });
            }
            
            const [result] = await pool.execute(
                'UPDATE experiments SET name = ?, material = ?, experiment_type = ?, description = ? WHERE id = ?',
                [name, material, experiment_type, description || '', id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: '实验不存在'
                });
            }
            
            res.json({
                success: true,
                data: {
                    id: parseInt(id),
                    name,
                    material,
                    experiment_type,
                    description
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async deleteExperiment(req, res) {
        try {
            const { id } = req.params;
            
            const [result] = await pool.execute(
                'DELETE FROM experiments WHERE id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: '实验不存在'
                });
            }
            
            res.json({
                success: true,
                message: '实验删除成功'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async batchInsertDataPoints(req, res) {
        try {
            const { experiment_id, data_points } = req.body;
            
            if (!experiment_id || !data_points || !Array.isArray(data_points)) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数：experiment_id, data_points(数组)'
                });
            }
            
            if (data_points.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '数据点数组不能为空'
                });
            }
            
            if (data_points.length < 5) {
                return res.status(400).json({
                    success: false,
                    error: '至少需要5个数据点'
                });
            }
            
            const validPoints = data_points.filter(p => 
                p.time_value !== undefined && 
                p.temperature !== undefined &&
                !isNaN(parseFloat(p.time_value)) &&
                !isNaN(parseFloat(p.temperature))
            );
            
            if (validPoints.length !== data_points.length) {
                return res.status(400).json({
                    success: false,
                    error: '存在无效数据点，请检查数据格式'
                });
            }
            
            const values = validPoints.map(point => [
                experiment_id,
                parseFloat(point.time_value),
                parseFloat(point.temperature)
            ]);
            
            const placeholders = validPoints.map(() => '(?, ?, ?)').join(', ');
            const flatValues = values.flat();
            
            let connection;
            try {
                connection = await pool.getConnection();
                const [result] = await connection.execute(
                    `INSERT INTO data_points (experiment_id, time_value, temperature) VALUES ${placeholders}`,
                    flatValues
                );
                
                res.status(201).json({
                    success: true,
                    data: {
                        insertedCount: result.affectedRows,
                        experiment_id
                    }
                });
            } catch (dbError) {
                console.error('数据库操作失败:', dbError.message);
                if (dbError.code === 'ETIMEDOUT' || dbError.code === 'ECONNREFUSED') {
                    return res.status(503).json({
                        success: false,
                        error: '数据库连接超时，请稍后重试'
                    });
                }
                throw dbError;
            } finally {
                if (connection) {
                    connection.release();
                }
            }
        } catch (error) {
            console.error('批量插入数据点失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '服务器内部错误'
            });
        }
    },

    async getDataPoints(req, res) {
        try {
            const { experiment_id } = req.params;
            const [rows] = await pool.execute(
                'SELECT * FROM data_points WHERE experiment_id = ? ORDER BY time_value',
                [experiment_id]
            );
            
            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async calculatePhaseTransition(req, res) {
        try {
            const { experiment_id } = req.params;
            
            const [rows] = await pool.execute(
                'SELECT time_value, temperature FROM data_points WHERE experiment_id = ? ORDER BY time_value',
                [experiment_id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: '未找到该实验的数据点'
                });
            }
            
            const result = calculatePhaseTransition(rows);
            
            if (!result.success) {
                return res.status(400).json(result);
            }
            
            res.json({
                success: true,
                experiment_id: parseInt(experiment_id),
                phaseTransition: result.phaseTransition,
                details: result.details
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = experimentController;
